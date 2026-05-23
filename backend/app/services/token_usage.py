"""Helpers for estimating and recording chat token usage."""

from dataclasses import dataclass
from math import ceil
import re
from typing import Iterable

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import ChatTokenUsage


@dataclass(frozen=True)
class TokenUsageBreakdown:
    input_tokens: int = 0
    output_tokens: int = 0
    cache_tokens: int = 0
    total_tokens: int = 0
    usage_source: str = "estimated"


def _non_negative(value: int | None) -> int:
    return max(0, int(value or 0))


def combine_token_usage(*items: TokenUsageBreakdown | None) -> TokenUsageBreakdown | None:
    """Combine multiple provider usage objects into a single chat-turn total."""
    present = [item for item in items if item is not None]
    if not present:
        return None

    input_tokens = sum(_non_negative(item.input_tokens) for item in present)
    output_tokens = sum(_non_negative(item.output_tokens) for item in present)
    cache_tokens = sum(_non_negative(item.cache_tokens) for item in present)
    total_tokens = sum(_non_negative(item.total_tokens) for item in present)
    if total_tokens == 0:
        total_tokens = input_tokens + output_tokens

    return TokenUsageBreakdown(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cache_tokens=cache_tokens,
        total_tokens=total_tokens,
        usage_source="provider" if any(item.usage_source == "provider" for item in present) else "estimated",
    )


def estimate_text_tokens(text: str | None) -> int:
    """Estimate token count without provider metadata.

    The heuristic intentionally overweights whitespace-separated words and
    character count so Bangla and English text are both roughly represented.
    """
    if not text:
        return 0

    stripped = text.strip()
    if not stripped:
        return 0

    word_count = len(re.findall(r"\S+", stripped))
    word_estimate = word_count * 1.35
    char_estimate = len(stripped) / 4
    return max(1, ceil(max(word_estimate, char_estimate)))


def estimate_messages_tokens(messages: Iterable[dict[str, str]]) -> int:
    total = 0
    for message in messages:
        total += estimate_text_tokens(message.get("role"))
        total += estimate_text_tokens(message.get("content"))
    return total


def estimate_chat_turn_usage(
    *,
    input_texts: Iterable[str | None],
    output_text: str | None,
) -> TokenUsageBreakdown:
    input_tokens = sum(estimate_text_tokens(text) for text in input_texts)
    output_tokens = estimate_text_tokens(output_text)
    return TokenUsageBreakdown(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cache_tokens=0,
        total_tokens=input_tokens + output_tokens,
        usage_source="estimated",
    )


async def record_chat_token_usage(
    db: AsyncSession,
    *,
    user_id: str,
    conversation_id: str,
    user_message_id: str,
    assistant_message_id: str,
    model_used: str | None,
    usage: TokenUsageBreakdown,
) -> ChatTokenUsage:
    row = ChatTokenUsage(
        user_id=user_id,
        conversation_id=conversation_id,
        user_message_id=user_message_id,
        assistant_message_id=assistant_message_id,
        model_used=model_used,
        input_tokens=_non_negative(usage.input_tokens),
        output_tokens=_non_negative(usage.output_tokens),
        cache_tokens=_non_negative(usage.cache_tokens),
        total_tokens=_non_negative(usage.total_tokens)
        or (_non_negative(usage.input_tokens) + _non_negative(usage.output_tokens)),
        usage_source=usage.usage_source if usage.usage_source in {"provider", "estimated"} else "estimated",
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row
