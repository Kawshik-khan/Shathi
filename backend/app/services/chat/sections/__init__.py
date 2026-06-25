"""Context sections.

Each module exposes a single factory function that takes a
``ProviderContext`` and returns a ``ContextResult``. The builder
imports them by name and runs them in parallel.
"""
from app.services.chat.sections.profile import build as build_profile
from app.services.chat.sections.mood import build as build_mood
from app.services.chat.sections.journal import build as build_journal
from app.services.chat.sections.sleep import build as build_sleep
from app.services.chat.sections.habit import build as build_habit
from app.services.chat.sections.activity import build as build_activity
from app.services.chat.sections.memory import build as build_memory
from app.services.chat.sections.inferred_mood import build as build_inferred_mood

__all__ = [
    "build_profile",
    "build_mood",
    "build_journal",
    "build_sleep",
    "build_habit",
    "build_activity",
    "build_memory",
    "build_inferred_mood",
]
