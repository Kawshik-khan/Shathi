"""Scoreless mood inference from text and behavioral signals."""

from __future__ import annotations

import asyncio
import logging
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.conversation import Conversation, Message
from app.models.habit import Habit, HabitCompletion
from app.models.journal import Journal
from app.models.mood_signal import AppActivityEvent, MoodReflection, SleepTimingEntry
from app.schemas.mood import (
    AppActivityEventCreate,
    MoodInference,
    MoodInferenceEvidence,
    MoodReflectionCreate,
    SleepTimingCreate,
)
from app.services.emotion import detect_emotion


logger = logging.getLogger(__name__)


NEGATIVE_TERMS = {
    "sadness": [
        "sad",
        "down",
        "cry",
        "hopeless",
        "empty",
        "unhappy",
        "কষ্ট",
        "খারাপ",
        "মন খারাপ",
        "কান্না",
        "একলা",
    ],
    "stress": [
        "stress",
        "stressed",
        "pressure",
        "overwhelmed",
        "can't focus",
        "cant focus",
        "চাপ",
        "টেনশন",
        "ফোকাস",
        "পারছি না",
    ],
    "low_energy": [
        "tired",
        "exhausted",
        "drained",
        "no energy",
        "fatigue",
        "ক্লান্ত",
        "শক্তি নেই",
        "অবসাদ",
        "দুর্বল",
    ],
    "burnout": [
        "burnout",
        "burned out",
        "everything feels exhausting",
        "can't anymore",
        "সবকিছু ক্লান্তিকর",
        "আর পারছি না",
        "শেষ হয়ে গেছি",
    ],
    "frustration": [
        "angry",
        "frustrated",
        "annoyed",
        "irritated",
        "rage",
        "রাগ",
        "বিরক্ত",
        "হতাশ",
    ],
    "anxiety": [
        "anxious",
        "worried",
        "panic",
        "nervous",
        "fear",
        "চিন্তা",
        "ভয়",
        "উদ্বেগ",
        "অস্থির",
    ],
    "positive": [
        "good",
        "better",
        "happy",
        "grateful",
        "calm",
        "ভালো",
        "শান্ত",
        "খুশি",
        "কৃতজ্ঞ",
    ],
}

STATE_BN = {
    "low_energy": "কম শক্তি",
    "stress": "চাপ",
    "sadness": "মন খারাপ",
    "burnout": "বার্নআউট",
    "frustration": "বিরক্তি",
    "anxiety": "উদ্বেগ",
    "positive": "ইতিবাচক অবস্থা",
    "neutral": "স্থিতিশীল অবস্থা",
}

SUPPORT_TONES = {
    "low_energy": "short_gentle",
    "stress": "calm_practical",
    "sadness": "warm_supportive",
    "burnout": "calm_practical",
    "frustration": "direct_non_judgmental",
    "anxiety": "grounded_reassuring",
    "positive": "upbeat",
    "neutral": "normal",
}


@dataclass
class Evidence:
    category: str
    state: str
    reason_bn: str
    reason_en: str
    weight: int


def _words(text: str) -> list[str]:
    return re.findall(r"[\w\u0980-\u09FF']+", text.lower())


def _has_any(text: str, terms: Iterable[str]) -> bool:
    lowered = text.lower()
    return any(term in lowered for term in terms)


def _dominant_state(evidence: list[Evidence]) -> tuple[str, str]:
    if not evidence:
        return "neutral", "low"

    scores: defaultdict[str, int] = defaultdict(int)
    for item in evidence:
        scores[item.state] += item.weight

    state, score = max(scores.items(), key=lambda pair: pair[1])
    if score >= 8:
        confidence = "high"
    elif score >= 4:
        confidence = "medium"
    else:
        confidence = "low"
    return state, confidence


def analyze_text_signals(texts: list[str]) -> list[Evidence]:
    """Infer emotion and writing-style evidence from natural text."""
    evidence: list[Evidence] = []
    non_empty = [text.strip() for text in texts if text and text.strip()]
    if not non_empty:
        return evidence

    combined = "\n".join(non_empty)
    for state, terms in NEGATIVE_TERMS.items():
        if state == "positive":
            continue
        hits = sum(1 for term in terms if term in combined.lower())
        if hits:
            evidence.append(
                Evidence(
                    category="text",
                    state=state,
                    reason_bn=f"সাম্প্রতিক লেখায় {STATE_BN[state]}-এর ইঙ্গিত পাওয়া গেছে।",
                    reason_en=f"Recent writing includes signals of {state.replace('_', ' ')}.",
                    weight=min(4, hits + 1),
                )
            )

    positive_hits = sum(1 for term in NEGATIVE_TERMS["positive"] if term in combined.lower())
    if positive_hits and not evidence:
        evidence.append(
            Evidence(
                category="text",
                state="positive",
                reason_bn="সাম্প্রতিক লেখায় ইতিবাচক বা শান্ত অনুভূতির ইঙ্গিত আছে।",
                reason_en="Recent writing includes positive or calm signals.",
                weight=2,
            )
        )

    word_counts = [len(_words(text)) for text in non_empty]
    short_ratio = sum(1 for count in word_counts if count <= 4) / len(word_counts)
    if len(non_empty) >= 4 and short_ratio >= 0.5:
        evidence.append(
            Evidence(
                category="writing_style",
                state="low_energy",
                reason_bn="অনেক উত্তর খুব ছোট, যা কম শক্তি বা সরে যাওয়ার ইঙ্গিত হতে পারে।",
                reason_en="Many replies are very short, which can suggest low energy or withdrawal.",
                weight=2,
            )
        )

    repeated_words = [
        word
        for word, count in Counter(_words(combined)).items()
        if len(word) > 3 and count >= 4
    ]
    if repeated_words:
        evidence.append(
            Evidence(
                category="writing_style",
                state="stress",
                reason_bn="কিছু শব্দ বারবার এসেছে, যা একই চিন্তায় আটকে থাকার ইঙ্গিত দিতে পারে।",
                reason_en="Repeated wording can suggest rumination or stress.",
                weight=2,
            )
        )

    topic_switches = len(re.findall(r"\b(anyway|but|also|suddenly|actually)\b|কিন্তু|আবার|হঠাৎ", combined.lower()))
    if topic_switches >= 4:
        evidence.append(
            Evidence(
                category="writing_style",
                state="anxiety",
                reason_bn="দ্রুত বিষয় বদলানোর প্যাটার্ন আছে, যা অস্থিরতার ইঙ্গিত হতে পারে।",
                reason_en="Frequent topic switching can suggest anxiety or restlessness.",
                weight=2,
            )
        )

    if combined.count("!") >= 4 or _has_any(combined, NEGATIVE_TERMS["frustration"]):
        evidence.append(
            Evidence(
                category="writing_style",
                state="frustration",
                reason_bn="লেখার টোনে বিরক্তি বা তীব্রতার ইঙ্গিত আছে।",
                reason_en="The writing tone includes signs of frustration or intensity.",
                weight=2,
            )
        )

    long_negative = any(count >= 120 for count in word_counts) and any(
        item.state in {"sadness", "stress", "burnout", "anxiety"} for item in evidence
    )
    if long_negative:
        evidence.append(
            Evidence(
                category="writing_style",
                state="burnout",
                reason_bn="দীর্ঘ আবেগপূর্ণ লেখা মানসিক চাপ বা ওভারলোডের ইঙ্গিত হতে পারে।",
                reason_en="Long emotional writing can suggest overload or burnout.",
                weight=3,
            )
        )

    return evidence


def analyze_behavior_signals(
    activities: list[AppActivityEvent],
    sleeps: list[SleepTimingEntry],
    habits: list[Habit],
    completions: list[HabitCompletion],
    journals: list[Journal],
    reflections: list[MoodReflection],
    now: datetime,
) -> list[Evidence]:
    """Infer evidence from behavior and routine signals."""
    evidence: list[Evidence] = []

    late_events = [
        event
        for event in activities
        if 0 <= event.occurred_at.astimezone(timezone.utc).hour < 5
    ]
    if len(late_events) >= 2:
        evidence.append(
            Evidence(
                category="behavior",
                state="stress",
                reason_bn="রাতে দেরিতে একাধিক অ্যাক্টিভিটি দেখা গেছে।",
                reason_en="Multiple late-night activity events were detected.",
                weight=2,
            )
        )

    explicit_behavior = {
        "social_withdrawal": ("sadness", "সামাজিকভাবে কম যুক্ত থাকার সিগন্যাল পাওয়া গেছে।", "Reduced social engagement was logged."),
        "routine_missed": ("stress", "রুটিন মিস করার সিগন্যাল পাওয়া গেছে।", "A missed routine signal was logged."),
        "productivity_missed": ("low_energy", "প্রোডাক্টিভিটি কম থাকার সিগন্যাল পাওয়া গেছে।", "Reduced productivity was logged."),
        "productivity_completed": ("positive", "প্রোডাক্টিভ কাজ শেষ করার ইতিবাচক সিগন্যাল আছে।", "A completed productivity signal was logged."),
    }
    activity_counts = Counter(event.event_type for event in activities)
    for event_type, (state, reason_bn, reason_en) in explicit_behavior.items():
        count = activity_counts.get(event_type, 0)
        if count:
            evidence.append(
                Evidence(
                    category="behavior",
                    state=state,
                    reason_bn=reason_bn,
                    reason_en=reason_en,
                    weight=min(3, count),
                )
            )

    if activities:
        latest_activity = max(event.occurred_at for event in activities)
        if latest_activity < now - timedelta(days=3):
            evidence.append(
                Evidence(
                    category="behavior",
                    state="low_energy",
                    reason_bn="কয়েক দিন অ্যাপ ব্যবহার কম ছিল, যা কম শক্তির ইঙ্গিত হতে পারে।",
                    reason_en="Reduced app activity for several days can suggest low energy.",
                    weight=2,
                )
            )

    recent_completion_dates = {completion.completed_at for completion in completions}
    active_habits = [habit for habit in habits if habit.is_active]
    if active_habits:
        recent_days = {date.today() - timedelta(days=offset) for offset in range(5)}
        if not recent_completion_dates.intersection(recent_days):
            evidence.append(
                Evidence(
                    category="routine",
                    state="stress",
                    reason_bn="সাম্প্রতিক কয়েক দিন কোনো অভ্যাস সম্পন্ন হয়নি।",
                    reason_en="No habit completions were found in the last few days.",
                    weight=3,
                )
            )

    has_old_journal_activity = journals or reflections
    latest_reflection_time = max(
        [entry.written_at for entry in journals] + [entry.created_at for entry in reflections],
        default=None,
    )
    if has_old_journal_activity and latest_reflection_time and latest_reflection_time < now - timedelta(days=5):
        evidence.append(
            Evidence(
                category="routine",
                state="low_energy",
                reason_bn="কয়েক দিন কোনো জার্নাল বা রিফ্লেকশন লেখা হয়নি।",
                reason_en="No journal or reflection activity was found for several days.",
                weight=2,
            )
        )

    poor_sleep_count = 0
    for sleep in sleeps:
        slept_hour = sleep.slept_at.astimezone(timezone.utc).hour
        if slept_hour >= 20:
            # Convert UTC late evenings conservatively; explicit 0-4 UTC is also caught.
            pass
        if slept_hour < 5 or (sleep.duration_minutes is not None and sleep.duration_minutes < 360):
            poor_sleep_count += 1
    if poor_sleep_count:
        evidence.append(
            Evidence(
                category="sleep",
                state="stress",
                reason_bn="ঘুমের সময় বা ঘুমের দৈর্ঘ্যে চাপের ইঙ্গিত থাকতে পারে।",
                reason_en="Sleep timing or short sleep duration may indicate stress.",
                weight=min(3, poor_sleep_count + 1),
            )
        )

    return evidence


async def create_mood_reflection(
    db: AsyncSession,
    user_id: str,
    payload: MoodReflectionCreate,
) -> MoodReflection:
    emotion = None
    confidence = None
    try:
        result = await detect_emotion(payload.answer)
        emotion = result.emotion
        confidence = result.confidence
    except Exception:
        pass

    reflection = MoodReflection(
        user_id=user_id,
        prompt=payload.prompt,
        answer=payload.answer.strip(),
        emotion_detected=emotion,
        emotion_confidence=confidence,
    )
    db.add(reflection)
    await db.commit()
    await db.refresh(reflection)
    return reflection


async def create_activity_event(
    db: AsyncSession,
    user_id: str,
    payload: AppActivityEventCreate,
) -> AppActivityEvent:
    event = AppActivityEvent(
        user_id=user_id,
        event_type=payload.event_type.strip(),
        event_metadata=payload.event_metadata,
        occurred_at=payload.occurred_at or datetime.now(timezone.utc),
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def create_sleep_timing(
    db: AsyncSession,
    user_id: str,
    payload: SleepTimingCreate,
) -> SleepTimingEntry:
    duration_minutes = payload.duration_minutes
    if duration_minutes is None and payload.woke_at:
        duration_minutes = max(0, int((payload.woke_at - payload.slept_at).total_seconds() // 60))

    entry = SleepTimingEntry(
        user_id=user_id,
        slept_at=payload.slept_at,
        woke_at=payload.woke_at,
        duration_minutes=duration_minutes,
        quality_note=payload.quality_note,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def infer_mood_from_signals(
    db: AsyncSession,
    user_id: str,
    days: int = 14,
) -> MoodInference:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)

    messages_result = await db.execute(
        select(Message)
        .join(Conversation)
        .where(
            Conversation.user_id == user_id,
            Message.role == "user",
            Message.created_at >= since,
        )
        .order_by(desc(Message.created_at))
        .limit(50)
    )
    messages = list(messages_result.scalars().all())

    journals_result = await db.execute(
        select(Journal)
        .where(Journal.user_id == user_id, Journal.written_at >= since)
        .order_by(desc(Journal.written_at))
        .limit(20)
    )
    journals = list(journals_result.scalars().all())

    reflections_result = await db.execute(
        select(MoodReflection)
        .where(MoodReflection.user_id == user_id, MoodReflection.created_at >= since)
        .order_by(desc(MoodReflection.created_at))
        .limit(20)
    )
    reflections = list(reflections_result.scalars().all())

    activities_result = await db.execute(
        select(AppActivityEvent)
        .where(AppActivityEvent.user_id == user_id, AppActivityEvent.occurred_at >= since)
        .order_by(desc(AppActivityEvent.occurred_at))
        .limit(100)
    )
    activities = list(activities_result.scalars().all())

    sleeps_result = await db.execute(
        select(SleepTimingEntry)
        .where(SleepTimingEntry.user_id == user_id, SleepTimingEntry.slept_at >= since)
        .order_by(desc(SleepTimingEntry.slept_at))
        .limit(30)
    )
    sleeps = list(sleeps_result.scalars().all())

    habits_result = await db.execute(select(Habit).where(Habit.user_id == user_id))
    habits = list(habits_result.scalars().all())
    habit_ids = [habit.id for habit in habits]
    completions: list[HabitCompletion] = []
    if habit_ids:
        completions_result = await db.execute(
            select(HabitCompletion)
            .where(
                HabitCompletion.habit_id.in_(habit_ids),
                HabitCompletion.completed_at >= since.date(),
            )
            .order_by(desc(HabitCompletion.completed_at))
        )
        completions = list(completions_result.scalars().all())

    texts = [
        *(message.content for message in messages),
        *(journal.content for journal in journals),
        *(reflection.answer for reflection in reflections),
    ]
    evidence = [
        *analyze_text_signals(texts),
        *analyze_behavior_signals(
            activities=activities,
            sleeps=sleeps,
            habits=habits,
            completions=completions,
            journals=journals,
            reflections=reflections,
            now=now,
        ),
    ]
    state, confidence = _dominant_state(evidence)

    if evidence:
        reason_bn = f"সাম্প্রতিক সিগন্যাল অনুযায়ী {STATE_BN[state]}-এর ইঙ্গিত বেশি।"
        reason_en = f"Recent signals most strongly suggest {state.replace('_', ' ')}."
    else:
        reason_bn = "এখনও যথেষ্ট টেক্সট বা আচরণগত সিগন্যাল নেই, তাই Sathi স্বাভাবিক সহায়ক টোন ব্যবহার করবে।"
        reason_en = "There are not enough recent text or behavioral signals yet, so Sathi will use a normal supportive tone."

    return MoodInference(
        state=state,
        confidence=confidence,
        support_tone=SUPPORT_TONES[state],
        reason_bn=reason_bn,
        reason_en=reason_en,
        evidence=[
            MoodInferenceEvidence(
                category=item.category,  # type: ignore[arg-type]
                state=item.state,
                reason_bn=item.reason_bn,
                reason_en=item.reason_en,
                weight=item.weight,
            )
            for item in evidence[:8]
        ],
        source_counts={
            "chat_messages": len(messages),
            "journals": len(journals),
            "reflections": len(reflections),
            "activity_events": len(activities),
            "sleep_entries": len(sleeps),
            "habit_completions": len(completions),
        },
        days=days,
        generated_at=now,
    )

async def _fetch_messages(db: AsyncSession, user_id: str, since: datetime):
    result = await db.execute(
        select(Message)
        .join(Conversation)
        .where(
            Conversation.user_id == user_id,
            Message.role == "user",
            Message.created_at >= since,
        )
        .order_by(desc(Message.created_at))
        .limit(50)
    )
    return list(result.scalars().all())


async def _fetch_journals(db: AsyncSession, user_id: str, since: datetime):
    result = await db.execute(
        select(Journal)
        .where(Journal.user_id == user_id, Journal.written_at >= since)
        .order_by(desc(Journal.written_at))
        .limit(20)
    )
    return list(result.scalars().all())


async def _fetch_reflections(db: AsyncSession, user_id: str, since: datetime):
    result = await db.execute(
        select(MoodReflection)
        .where(MoodReflection.user_id == user_id, MoodReflection.created_at >= since)
        .order_by(desc(MoodReflection.created_at))
        .limit(20)
    )
    return list(result.scalars().all())


async def _fetch_activities(db: AsyncSession, user_id: str, since: datetime):
    result = await db.execute(
        select(AppActivityEvent)
        .where(AppActivityEvent.user_id == user_id, AppActivityEvent.occurred_at >= since)
        .order_by(desc(AppActivityEvent.occurred_at))
        .limit(100)
    )
    return list(result.scalars().all())


async def _fetch_sleeps(db: AsyncSession, user_id: str, since: datetime):
    result = await db.execute(
        select(SleepTimingEntry)
        .where(SleepTimingEntry.user_id == user_id, SleepTimingEntry.slept_at >= since)
        .order_by(desc(SleepTimingEntry.slept_at))
        .limit(30)
    )
    return list(result.scalars().all())


async def _fetch_habits_and_completions(db: AsyncSession, user_id: str, since: datetime):
    habits_result = await db.execute(select(Habit).where(Habit.user_id == user_id))
    habits = list(habits_result.scalars().all())
    completions: list[HabitCompletion] = []
    if habits:
        completions_result = await db.execute(
            select(HabitCompletion)
            .where(
                HabitCompletion.habit_id.in_([habit.id for habit in habits]),
                HabitCompletion.completed_at >= since.date(),
            )
            .order_by(desc(HabitCompletion.completed_at))
        )
        completions = list(completions_result.scalars().all())
    return habits, completions


async def _gather_signal_queries(
    db: AsyncSession, user_id: str, since: datetime, timeout_ms: int | None = None
) -> dict[str, list]:
    """Run all signal-loading queries concurrently with an optional timeout.

    A slow query is allowed to time out without blocking the others; failures are
    isolated to an empty list so downstream heuristics fall back to defaults.
    """
    settings = get_settings()
    budget = (timeout_ms or settings.CHAT_PROVIDER_TIMEOUT_MS) / 1000.0

    async def _guarded(name: str, coro):
        try:
            return await asyncio.wait_for(coro, timeout=budget)
        except asyncio.TimeoutError:
            logger.warning(
                "mood inference query %s timed out after %ss", name, budget,
                extra={"ContextProvider": "InferredMood", "SubQuery": name},
            )
            return []
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "mood inference query %s failed: %s", name, exc,
                extra={"ContextProvider": "InferredMood", "SubQuery": name},
            )
            return []

    messages, journals, reflections, activities, sleeps, habits_completions = await asyncio.gather(
        _guarded("messages", _fetch_messages(db, user_id, since)),
        _guarded("journals", _fetch_journals(db, user_id, since)),
        _guarded("reflections", _fetch_reflections(db, user_id, since)),
        _guarded("activities", _fetch_activities(db, user_id, since)),
        _guarded("sleeps", _fetch_sleeps(db, user_id, since)),
        _guarded("habits", _fetch_habits_and_completions(db, user_id, since)),
    )
    habits, completions = habits_completions if isinstance(habits_completions, tuple) else ([], [])
    return {
        "messages": messages,
        "journals": journals,
        "reflections": reflections,
        "activities": activities,
        "sleeps": sleeps,
        "habits": habits,
        "completions": completions,
    }


async def infer_mood_from_signals_parallel(
    db: AsyncSession,
    user_id: str,
    days: int = 14,
    timeout_ms: int | None = None,
) -> MoodInference:
    """Parallelized version of :func:`infer_mood_from_signals`.

    All evidence-loading queries run concurrently so the worst-case latency is
    bounded by the slowest query instead of their sum. The downstream analyzer
    is unchanged; on any failure an empty list is used, which keeps the
    heuristic well-defined.
    """
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)
    signals = await _gather_signal_queries(db, user_id, since, timeout_ms=timeout_ms)

    messages = signals["messages"]
    journals = signals["journals"]
    reflections = signals["reflections"]
    activities = signals["activities"]
    sleeps = signals["sleeps"]
    habits = signals["habits"]
    completions = signals["completions"]

    texts = [
        *(message.content for message in messages),
        *(journal.content for journal in journals),
        *(reflection.answer for reflection in reflections),
    ]
    evidence = [
        *analyze_text_signals(texts),
        *analyze_behavior_signals(
            activities=activities,
            sleeps=sleeps,
            habits=habits,
            completions=completions,
            journals=journals,
            reflections=reflections,
            now=now,
        ),
    ]
    state, confidence = _dominant_state(evidence)

    if evidence:
        reason_bn = f"সাম্প্রতিক সিগন্যাল অনুযায়ী {STATE_BN[state]}-এর ইঙ্গিত বেশি।"
        reason_en = f"Recent signals most strongly suggest {state.replace('_', ' ')}."
    else:
        reason_bn = "এখনও যথেষ্ট টেক্সট বা আচরণগত সিগন্যাল নেই, তাই Sathi স্বাভাবিক সহায়ক টোন ব্যবহার করবে।"
        reason_en = (
            "There are not enough recent text or behavioral signals yet, "
            "so Sathi will use a normal supportive tone."
        )
    return MoodInference(
        state=state,
        confidence=confidence,
        support_tone=SUPPORT_TONES[state],
        reason_bn=reason_bn,
        reason_en=reason_en,
        evidence=[
            MoodInferenceEvidence(
                category=item.category,  # type: ignore[arg-type]
                state=item.state,
                reason_bn=item.reason_bn,
                reason_en=item.reason_en,
                weight=item.weight,
            )
            for item in evidence[:8]
        ],
        source_counts={
            "chat_messages": len(messages),
            "journals": len(journals),
            "reflections": len(reflections),
            "activity_events": len(activities),
            "sleep_entries": len(sleeps),
            "habit_completions": len(completions),
        },
        days=days,
        generated_at=now,
    )
