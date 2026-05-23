from datetime import date, datetime, timedelta, timezone

from app.models.habit import Habit
from app.models.mood_signal import AppActivityEvent, SleepTimingEntry
from app.services.mood_inference import analyze_behavior_signals, analyze_text_signals


def test_text_inference_detects_low_energy_and_burnout():
    evidence = analyze_text_signals([
        "I can't focus today.",
        "Everything feels exhausting and I have no energy.",
    ])

    states = {item.state for item in evidence}

    assert "stress" in states
    assert "low_energy" in states
    assert "burnout" in states


def test_text_inference_detects_bengali_stress():
    evidence = analyze_text_signals([
        "আজ খুব চাপ লাগছে, ফোকাস করতে পারছি না।",
    ])

    assert any(item.state == "stress" for item in evidence)


def test_writing_style_detects_short_replies_as_low_energy():
    evidence = analyze_text_signals(["না", "ঠিক", "জানি না", "কিছু না"])

    assert any(item.category == "writing_style" and item.state == "low_energy" for item in evidence)


def test_behavior_inference_detects_late_night_and_missed_habits():
    now = datetime.now(timezone.utc)
    activities = [
        AppActivityEvent(
            user_id="user-1",
            event_type="app_open",
            occurred_at=now.replace(hour=3, minute=0, second=0, microsecond=0),
        ),
        AppActivityEvent(
            user_id="user-1",
            event_type="routine_missed",
            occurred_at=now.replace(hour=2, minute=0, second=0, microsecond=0),
        ),
    ]
    habits = [
        Habit(
            id="habit-1",
            user_id="user-1",
            name="Journal",
            frequency="daily",
            target_count=1,
            is_active=True,
        )
    ]

    evidence = analyze_behavior_signals(
        activities=activities,
        sleeps=[],
        habits=habits,
        completions=[],
        journals=[],
        reflections=[],
        now=now,
    )

    assert any(item.category == "behavior" and item.state == "stress" for item in evidence)
    assert any(item.category == "routine" and item.state == "stress" for item in evidence)


def test_behavior_inference_detects_short_sleep():
    now = datetime.now(timezone.utc)
    sleeps = [
        SleepTimingEntry(
            user_id="user-1",
            slept_at=now - timedelta(hours=5),
            woke_at=now,
            duration_minutes=300,
        )
    ]

    evidence = analyze_behavior_signals(
        activities=[],
        sleeps=sleeps,
        habits=[],
        completions=[],
        journals=[],
        reflections=[],
        now=now,
    )

    assert any(item.category == "sleep" and item.state == "stress" for item in evidence)
