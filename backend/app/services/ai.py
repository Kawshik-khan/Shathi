"""AI service for chat generation via Hugging Face Router.

Uses a single AsyncOpenAI client pointing at https://router.huggingface.co/v1
to access both Llama 3.3 70B (Groq — low latency primary) and
DeepSeek V4 Pro (Novita — fallback).
"""

import logging
from typing import AsyncGenerator, List, Dict, Literal

from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model registry — friendly name → HF Router model ID
# ---------------------------------------------------------------------------
MODEL_REGISTRY: Dict[str, str] = {
    "llama-3.3-70b": "meta-llama/Llama-3.3-70B-Instruct:groq",
    "deepseek-v4-pro": "deepseek-ai/DeepSeek-V4-Pro:novita",
}

# Ordered fallback chain: try primary first, then secondary
FALLBACK_ORDER = ["llama-3.3-70b", "deepseek-v4-pro"]

# ---------------------------------------------------------------------------
# Sathi system prompt — mental wellness companion persona
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = (
    "You are Sathi, an empathetic AI mental wellness companion. "
    "You provide emotional support, help users process their feelings, "
    "and encourage healthy mental health practices. "
    "Be warm, non-judgmental, and supportive. "
    "If someone shows signs of crisis, respond with care and suggest professional help. "
    "Keep responses concise but meaningful — typically 2-4 paragraphs."
)

# Safe static fallback when all models fail
SAFE_FALLBACK_RESPONSE = (
    "I'm here to support you, and I want you to know your feelings are valid. "
    "I'm experiencing a temporary issue connecting to my language engine, "
    "but I don't want that to stop you from reaching out. "
    "Please try again in a moment, or if you're in crisis, "
    "contact the 988 Suicide & Crisis Lifeline (call or text 988)."
)


def _get_hf_client() -> AsyncOpenAI:
    """Create an AsyncOpenAI client pointing at the HF Router."""
    settings = get_settings()

    # Prefer HF_API_TOKEN, fall back to HF_TOKEN
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


def _build_messages(
    message: str,
    conversation_history: List[Dict[str, str]],
) -> List[Dict[str, str]]:
    """Build the messages array with system prompt + history + user message."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": message})
    return messages


async def generate_chat_response(
    message: str,
    conversation_history: List[Dict[str, str]],
    model: Literal["llama-3.3-70b", "deepseek-v4-pro"] = "llama-3.3-70b",
    stream: bool = False,
) -> str:
    """Generate AI chat response with automatic fallback.

    Tries the requested model first, then falls through the fallback chain.
    If all models fail, returns a safe static response.
    """
    client = _get_hf_client()
    messages = _build_messages(message, conversation_history)

    # Build ordered list: requested model first, then remaining fallbacks
    models_to_try = [model] + [m for m in FALLBACK_ORDER if m != model]

    last_error = None
    for model_name in models_to_try:
        model_id = MODEL_REGISTRY.get(model_name)
        if not model_id:
            continue

        try:
            logger.info("Trying model %s (%s)", model_name, model_id)
            response = await client.chat.completions.create(
                model=model_id,
                messages=messages,
                temperature=0.7,
                max_tokens=600,
                stream=False,
            )
            content = response.choices[0].message.content
            if content:
                logger.info("Got response from %s (%d chars)", model_name, len(content))
                return content

        except Exception as e:
            last_error = e
            logger.warning(
                "Model %s failed: %s — trying next fallback",
                model_name,
                str(e),
            )
            continue

    # All models failed
    logger.error("All models failed. Last error: %s", last_error)
    return SAFE_FALLBACK_RESPONSE


async def generate_streaming_response(
    message: str,
    conversation_history: List[Dict[str, str]],
    model: Literal["llama-3.3-70b", "deepseek-v4-pro"] = "llama-3.3-70b",
) -> AsyncGenerator[str, None]:
    """Generate streaming AI response via SSE.

    Uses the same fallback logic: if the primary model stream fails,
    falls back to a non-streaming call on the secondary model.
    """
    client = _get_hf_client()
    messages = _build_messages(message, conversation_history)

    model_id = MODEL_REGISTRY.get(model)
    if not model_id:
        yield SAFE_FALLBACK_RESPONSE
        return

    try:
        logger.info("Streaming from %s (%s)", model, model_id)
        stream = await client.chat.completions.create(
            model=model_id,
            messages=messages,
            temperature=0.7,
            max_tokens=600,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    except Exception as e:
        logger.warning("Streaming failed for %s: %s — falling back", model, e)
        # Fall back to non-streaming on any remaining model
        fallback_response = await generate_chat_response(
            message, conversation_history, model, stream=False
        )
        yield fallback_response

