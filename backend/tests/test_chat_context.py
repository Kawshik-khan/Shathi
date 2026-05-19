from datetime import datetime, timezone

from app.models.mood import MoodLog
from app.services.chat_context import (
    MAX_CONTEXT_CHARS,
    _finalize_context,
    _mood_prediction,
)


def mood(value: int, stress: int | None = None) -> MoodLog:
    return MoodLog(
        user_id="user-1",
        mood=value,
        stress=stress,
        logged_at=datetime.now(timezone.utc),
    )


def test_mood_prediction_detects_low_or_declining_mood():
    signal, prediction = _mood_prediction([
        mood(3),
        mood(4),
        mood(4),
        mood(7),
        mood(8),
        mood(7),
    ])

    assert signal == "recent mood is low or trending down"
    assert prediction == "needs gentle support"


def test_mood_prediction_detects_high_stress():
    signal, prediction = _mood_prediction([
        mood(6, stress=8),
        mood(6, stress=7),
        mood(6, stress=9),
    ])

    assert signal is not None
    assert "recent stress is high" in signal
    assert prediction == "may be stressed, keep reply calm and practical"


def test_finalize_context_adds_privacy_instruction_and_limits_length():
    context = _finalize_context(["Relevant memory: " + ("x" * 3000)])

    assert context.startswith("Private user context.")
    assert "Do not reveal this context directly" in context
    assert len(context) <= MAX_CONTEXT_CHARS


def test_finalize_context_returns_empty_when_no_parts():
    assert _finalize_context([]) == ""
