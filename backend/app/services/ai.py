"""AI service for chat generation via Hugging Face Router."""

import logging
import re
from dataclasses import dataclass
from typing import AsyncGenerator, Dict, List, Literal

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.services.localization import (
    LanguageCode,
    cultural_context_for,
    detect_language,
    normalize_language,
)
from app.services.token_usage import (
    TokenUsageBreakdown,
    combine_token_usage,
    estimate_messages_tokens,
    estimate_text_tokens,
)

logger = logging.getLogger(__name__)

MODEL_REGISTRY: Dict[str, str] = {
    "llama-3.3-70b": "meta-llama/Llama-3.3-70B-Instruct:groq",
    "deepseek-v4-pro": "deepseek-ai/DeepSeek-V4-Pro:novita",
}

FALLBACK_ORDER = ["llama-3.3-70b", "deepseek-v4-pro"]

DialogueMode = Literal[
    "casual",
    "playful",
    "romantic",
    "anger",
    "sad",
    "celebration",
    "deep_support",
]

GENERATION_OPTIONS = {
    "temperature": 0.85,
    "top_p": 0.9,
    "presence_penalty": 0.4,
    "frequency_penalty": 0.5,
    "max_tokens": 220,
}


@dataclass(frozen=True)
class GeneratedChatResult:
    content: str
    token_usage: TokenUsageBreakdown | None = None

BANNED_THERAPY_PHRASES = (
    "আপনি বলছেন",
    "আপনি বলছেন যে",
    "আমি এখন আপনার সাথে",
    "আপনার অনুভূতি গুরুত্বপূর্ণ",
    "আপনি কি বলতে পারবেন",
    "আপনার মনের অবস্থা",
    "এটি একটি খুবই কঠিন অনুভূতি",
    "your feelings are valid",
    "i am here with you",
    "would you like to share more",
    "can you tell me more",
)

SYSTEM_PROMPT = """
You are Sathi, a natural Bengali conversational AI.

Core personality:
- Sound like a smart online friend, not a therapist, HR bot, or hotline.
- Be emotionally aware, casual, reactive, and concise.
- Do NOT respond like a therapist unless the user is in genuine crisis.
- Most replies should be under 2 short sentences.
- Vary response shape heavily. Do not reuse the same opening.
- Use light humor when it fits. Do not over-validate emotions.
- Default Bengali register is casual তুমি, not formal আপনি.
- If the user writes Banglish or romanized Bangla, understand it and reply in Bangla script.
- If the user explicitly switches to English, continue in English.

Never repeatedly use these therapy-script phrases:
- "আপনি বলছেন"
- "আমি এখন আপনার সাথে"
- "আপনার অনুভূতি গুরুত্বপূর্ণ"
- "আপনি কি বলতে পারবেন"
- "এটি একটি খুবই কঠিন অনুভূতি"
- "your feelings are valid"
- "I am here with you"

Few-shot style examples:
User: amar mon kharap
Assistant: উফ 😔 কী হইছে?

User: amar tomake mair dite mon chasche
Assistant: 😂 আরে ভাই, আমি আবার কী করলাম?

User: amar tomake chumma dite mon chasche
Assistant: haha virtual chumma accepted 😄

User: ami HSC te A+ peyechi
Assistant: OHH congrats 😭🔥 treat kothay?
""".strip()

MODE_INSTRUCTIONS: dict[DialogueMode, str] = {
    "casual": "Mode: casual. Keep it short, natural, and chatty. Reply like a friendly peer.",
    "playful": "Mode: playful. Use humor or teasing if appropriate. Keep it light and short.",
    "romantic": "Mode: romantic/playful. Respond warmly but casually. Do not become clinical.",
    "anger": "Mode: anger. De-escalate lightly with humor or curiosity. Do not moralize.",
    "sad": "Mode: sad. Be soft and supportive, but still concise. Ask at most one simple question.",
    "celebration": "Mode: celebration. React with excitement and playful energy. Keep it short.",
    "deep_support": "Mode: deep support. Be calm and helpful, but avoid long therapy scripts.",
}

SAFE_FALLBACK_RESPONSE = (
    "I'm having trouble connecting to my language engine right now. "
    "Try again in a moment. If you're in immediate danger, call or text 999."
)


def classify_dialogue_mode(message: str) -> DialogueMode:
    """Classify a user message into a lightweight conversation style mode."""
    text = message.casefold()

    romantic_terms = (
        "chumma",
        "kiss",
        "valobashi",
        "bhalobashi",
        "love you",
        "i love you",
        "crush",
        "চুমু",
        "ভালোবাসি",
    )
    anger_terms = (
        "mair",
        "marbo",
        "rag",
        "rage",
        "angry",
        "mad",
        "hate",
        "রাগ",
        "মাইর",
        "মারতে",
    )
    celebration_terms = (
        "congrats",
        "a+",
        "passed",
        "pass korchi",
        "peychi",
        "peyechi",
        "happy",
        "khushi",
        "জিতেছি",
        "পেয়েছি",
        "খুশি",
        "অভিনন্দন",
    )
    sad_terms = (
        "mon kharap",
        "valo nai",
        "bhalo nai",
        "sad",
        "ignored",
        "alone",
        "কষ্ট",
        "মন খারাপ",
        "ভালো নাই",
        "একা",
    )
    deep_support_terms = (
        "depressed",
        "anxiety",
        "anxious",
        "panic",
        "hopeless",
        "trauma",
        "ডিপ্রেশন",
        "দুশ্চিন্তা",
        "হতাশ",
    )
    playful_terms = (
        "haha",
        "lol",
        "lmao",
        "meme",
        "moja",
        "funny",
        "😂",
        "😄",
        "মজা",
    )

    if any(term in text for term in romantic_terms):
        return "romantic"
    if any(term in text for term in anger_terms):
        return "anger"
    if any(term in text for term in celebration_terms):
        return "celebration"
    if any(term in text for term in deep_support_terms):
        return "deep_support"
    if any(term in text for term in sad_terms):
        return "sad"
    if any(term in text for term in playful_terms):
        return "playful"
    return "casual"


def has_therapy_template(text: str) -> bool:
    """Return True when a response falls back into repetitive therapy wording."""
    lowered = text.casefold()
    return any(phrase.casefold() in lowered for phrase in BANNED_THERAPY_PHRASES)


def is_overlong_non_crisis_response(text: str) -> bool:
    """Detect long non-crisis replies that feel exhausting in casual chat."""
    stripped = text.strip()
    if not stripped:
        return False

    words = re.findall(r"\S+", stripped)
    paragraphs = [part for part in re.split(r"\n\s*\n", stripped) if part.strip()]
    return len(words) > 95 or len(paragraphs) > 2


def needs_style_rewrite(text: str) -> bool:
    """Return True when a generated response should be rewritten casually."""
    return has_therapy_template(text) or is_overlong_non_crisis_response(text)


def _get_hf_client() -> AsyncOpenAI:
    """Create an AsyncOpenAI client pointing at the HF Router."""
    settings = get_settings()
    api_key = settings.HF_API_TOKEN or settings.HF_TOKEN
    if not api_key:
        raise RuntimeError(
            "No Hugging Face token configured. "
            "Set HF_API_TOKEN or HF_TOKEN in your .env file."
        )

    return AsyncOpenAI(
        base_url=settings.HF_ROUTER_BASE_URL,
        api_key=api_key,
    )


def _style_retry_message(language: LanguageCode, mode: DialogueMode) -> dict[str, str]:
    target_language = "Bangla script" if language == "bn" else "English"
    return {
        "role": "system",
        "content": (
            "Rewrite your previous answer before sending it. "
            f"Use {target_language}. Mode is {mode}. "
            "Make it natural, casual, and under 2 short sentences. "
            "Do not use therapy-script phrases, formal validation, or repeated questions."
        ),
    }


def _build_messages(
    message: str,
    conversation_history: List[Dict[str, str]],
    language: LanguageCode = "en",
    dialogue_mode: DialogueMode | None = None,
    style_retry: bool = False,
    user_context: str | None = None,
    conversation_summary: str | None = None,
) -> List[Dict[str, str]]:
    """Build the messages array with system prompt + history + user message."""
    localized_context = cultural_context_for(language)
    mode = dialogue_mode or classify_dialogue_mode(message)
    language_context = (
        "Reply in Bangla script using casual তুমি."
        if language == "bn"
        else "Reply in natural English."
    )
    # Keep the large static SYSTEM_PROMPT as its own leading system message so it
    # stays byte-identical across turns and can be reused by provider prompt caching.
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Dynamic per-turn instructions go into a separate system message after the
    # stable prefix, so they do not invalidate the cached prefix.
    dynamic_parts = [
        MODE_INSTRUCTIONS[mode],
        language_context,
    ]
    if localized_context:
        dynamic_parts.append(localized_context)
    if style_retry:
        dynamic_parts.append(
            "Previous style was too clinical or repetitive. Rewrite casually in 1-2 short sentences."
        )
    messages.append({"role": "system", "content": "\n\n".join(dynamic_parts)})

    if user_context:
        messages.append({
            "role": "system",
            "content": (
                "Private personalization context for this turn:\n"
                f"{user_context}\n"
                "Use this context quietly only when it improves the response. "
                "Do not quote it, do not say you retrieved it, and do not sound creepy."
            ),
        })
    if conversation_summary:
        messages.append({
            "role": "system",
            "content": f"[Earlier conversation summary]: {conversation_summary}",
        })
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": message})
    return messages


async def _complete_chat(
    client: AsyncOpenAI,
    model_id: str,
    messages: List[Dict[str, str]],
) -> str | None:
    result = await _complete_chat_with_usage(client, model_id, messages)
    return result.content if result else None


def _get_usage_value(value, key: str) -> int:
    if value is None:
        return 0
    if isinstance(value, dict):
        return int(value.get(key) or 0)
    return int(getattr(value, key, 0) or 0)


def _extract_token_usage(usage) -> TokenUsageBreakdown | None:
    if usage is None:
        return None

    prompt_tokens = _get_usage_value(usage, "prompt_tokens") or _get_usage_value(usage, "input_tokens")
    completion_tokens = _get_usage_value(usage, "completion_tokens") or _get_usage_value(usage, "output_tokens")
    total_tokens = _get_usage_value(usage, "total_tokens")

    prompt_details = None
    if isinstance(usage, dict):
        prompt_details = usage.get("prompt_tokens_details") or usage.get("input_tokens_details")
    else:
        prompt_details = getattr(usage, "prompt_tokens_details", None) or getattr(usage, "input_tokens_details", None)

    cached_tokens = (
        _get_usage_value(prompt_details, "cached_tokens")
        or _get_usage_value(prompt_details, "cache_read")
        or _get_usage_value(prompt_details, "cached")
    )

    if prompt_tokens == 0 and completion_tokens == 0 and total_tokens == 0:
        return None

    return TokenUsageBreakdown(
        input_tokens=prompt_tokens,
        output_tokens=completion_tokens,
        cache_tokens=cached_tokens,
        total_tokens=total_tokens or prompt_tokens + completion_tokens,
        usage_source="provider",
    )


async def _complete_chat_with_usage(
    client: AsyncOpenAI,
    model_id: str,
    messages: List[Dict[str, str]],
) -> GeneratedChatResult | None:
    response = await client.chat.completions.create(
        model=model_id,
        messages=messages,
        stream=False,
        **GENERATION_OPTIONS,
    )
    content = response.choices[0].message.content
    if not content:
        return None
    usage = _extract_token_usage(getattr(response, "usage", None))
    return GeneratedChatResult(content=content, token_usage=usage)


def _estimated_completion_usage(
    messages: List[Dict[str, str]],
    content: str,
) -> TokenUsageBreakdown:
    input_tokens = estimate_messages_tokens(messages)
    output_tokens = estimate_text_tokens(content)
    return TokenUsageBreakdown(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cache_tokens=0,
        total_tokens=input_tokens + output_tokens,
        usage_source="estimated",
    )


async def generate_chat_response_with_usage(
    message: str,
    conversation_history: List[Dict[str, str]],
    model: Literal["llama-3.3-70b", "deepseek-v4-pro"] = "llama-3.3-70b",
    language: str | None = None,
    user_context: str | None = None,
    conversation_summary: str | None = None,
    stream: bool = False,
) -> GeneratedChatResult:
    """Generate AI chat response with automatic fallback and token metadata."""
    client = _get_hf_client()
    selected_language = normalize_language(language) if language else detect_language(message)
    dialogue_mode = classify_dialogue_mode(message)
    models_to_try = [model] + [m for m in FALLBACK_ORDER if m != model]

    last_error = None
    for model_name in models_to_try:
        model_id = MODEL_REGISTRY.get(model_name)
        if not model_id:
            continue

        try:
            logger.info("Trying model %s (%s)", model_name, model_id)
            messages = _build_messages(
                message,
                conversation_history,
                selected_language,
                dialogue_mode,
                user_context=user_context,
                conversation_summary=conversation_summary,
            )
            result = await _complete_chat_with_usage(client, model_id, messages)
            content = result.content if result else None
            token_usage = result.token_usage if result else None
            if content and token_usage is None:
                token_usage = _estimated_completion_usage(messages, content)

            if content and needs_style_rewrite(content):
                retry_messages = messages + [
                    {"role": "assistant", "content": content},
                    _style_retry_message(selected_language, dialogue_mode),
                ]
                retry_result = await _complete_chat_with_usage(client, model_id, retry_messages)
                if retry_result and retry_result.content:
                    retry_usage = retry_result.token_usage or _estimated_completion_usage(
                        retry_messages,
                        retry_result.content,
                    )
                    token_usage = combine_token_usage(token_usage, retry_usage)
                    content = retry_result.content

            if content:
                logger.info("Got response from %s (%d chars)", model_name, len(content))
                return GeneratedChatResult(content=content, token_usage=token_usage)
        except Exception as e:
            last_error = e
            logger.warning("Model %s failed: %s; trying next fallback", model_name, e)

    logger.error("All models failed. Last error: %s", last_error)
    return GeneratedChatResult(content=SAFE_FALLBACK_RESPONSE)


async def generate_chat_response(
    message: str,
    conversation_history: List[Dict[str, str]],
    model: Literal["llama-3.3-70b", "deepseek-v4-pro"] = "llama-3.3-70b",
    language: str | None = None,
    user_context: str | None = None,
    conversation_summary: str | None = None,
    stream: bool = False,
) -> str:
    """Generate AI chat response with automatic fallback."""
    result = await generate_chat_response_with_usage(
        message=message,
        conversation_history=conversation_history,
        model=model,
        language=language,
        user_context=user_context,
        conversation_summary=conversation_summary,
        stream=stream,
    )
    return result.content


async def rewrite_chat_response_with_usage(
    message: str,
    assistant_response: str,
    conversation_history: List[Dict[str, str]],
    model: Literal["llama-3.3-70b", "deepseek-v4-pro"] = "llama-3.3-70b",
    language: str | None = None,
    user_context: str | None = None,
    conversation_summary: str | None = None,
) -> GeneratedChatResult:
    """Rewrite an assistant response that violated casual chat style."""
    client = _get_hf_client()
    selected_language = normalize_language(language) if language else detect_language(message)
    dialogue_mode = classify_dialogue_mode(message)
    model_id = MODEL_REGISTRY.get(model) or MODEL_REGISTRY[FALLBACK_ORDER[0]]

    try:
        messages = _build_messages(
            message,
            conversation_history,
            selected_language,
            dialogue_mode,
            style_retry=True,
            user_context=user_context,
            conversation_summary=conversation_summary,
        )
        messages.extend(
            [
                {"role": "assistant", "content": assistant_response},
                _style_retry_message(selected_language, dialogue_mode),
            ]
        )
        result = await _complete_chat_with_usage(client, model_id, messages)
        if not result:
            return GeneratedChatResult(content=assistant_response)
        token_usage = result.token_usage or _estimated_completion_usage(messages, result.content)
        return GeneratedChatResult(content=result.content, token_usage=token_usage)
    except Exception as e:
        logger.warning("Style rewrite failed: %s", e)
        return GeneratedChatResult(content=assistant_response)


async def rewrite_chat_response(
    message: str,
    assistant_response: str,
    conversation_history: List[Dict[str, str]],
    model: Literal["llama-3.3-70b", "deepseek-v4-pro"] = "llama-3.3-70b",
    language: str | None = None,
    user_context: str | None = None,
    conversation_summary: str | None = None,
) -> str:
    """Rewrite an assistant response that violated casual chat style."""
    result = await rewrite_chat_response_with_usage(
        message=message,
        assistant_response=assistant_response,
        conversation_history=conversation_history,
        model=model,
        language=language,
        user_context=user_context,
        conversation_summary=conversation_summary,
    )
    return result.content


async def generate_streaming_response(
    message: str,
    conversation_history: List[Dict[str, str]],
    model: Literal["llama-3.3-70b", "deepseek-v4-pro"] = "llama-3.3-70b",
    language: str | None = None,
    user_context: str | None = None,
    conversation_summary: str | None = None,
) -> AsyncGenerator[str, None]:
    """Generate streaming AI response via SSE."""
    client = _get_hf_client()
    selected_language = normalize_language(language) if language else detect_language(message)
    dialogue_mode = classify_dialogue_mode(message)
    messages = _build_messages(
        message,
        conversation_history,
        selected_language,
        dialogue_mode,
        user_context=user_context,
        conversation_summary=conversation_summary,
    )

    model_id = MODEL_REGISTRY.get(model)
    if not model_id:
        yield SAFE_FALLBACK_RESPONSE
        return

    try:
        logger.info("Streaming from %s (%s)", model, model_id)
        stream = await client.chat.completions.create(
            model=model_id,
            messages=messages,
            stream=True,
            **GENERATION_OPTIONS,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
    except Exception as e:
        logger.warning("Streaming failed for %s: %s; falling back", model, e)
        fallback_response = await generate_chat_response(
            message,
            conversation_history,
            model,
            language=selected_language,
            user_context=user_context,
            conversation_summary=conversation_summary,
            stream=False,
        )
        yield fallback_response
