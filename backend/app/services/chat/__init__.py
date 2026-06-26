"""Modular chat context package.

This subpackage holds the new modular context-builder pipeline introduced
in the 2026-06-25 streaming refactor. The public entrypoint is
``builder.build_chat_context``; legacy callers can still import
``app.services.chat_context.build_chat_context`` (now a thin shim).
"""
from __future__ import annotations

# The legacy ``app/services/chat.py`` module is loaded lazily (PEP 562) so
# that importing the modern subpackage -- e.g. ``from app.services.chat
# .builder import build_chat_context_with_budget`` -- does NOT eagerly
# execute the legacy module. The legacy module imports from
# ``app.services.chat_context``, which in turn imports from
# ``app.services.chat.builder``; eager loading would deadlock in a
# circular import the moment ``chat_context`` is initialised.
import importlib.util as _importlib_util
import sys as _sys
from pathlib import Path as _Path

from app.services.chat.providers import (
    ContextResult,
    ContextProvider,
    ProviderContext,
    run_provider,
)
from app.services.chat.builder import (
    BuiltContext,
    ContextBuilder,
    build_chat_context,
    build_chat_context_with_budget,
)


_LEGACY_NAMES = (
    "send_chat_message_stream",
    "send_chat_message",
    "get_conversations",
    "get_conversation_by_id",
    "get_conversation_messages",
    "delete_conversation",
    "update_conversation",
)

_chat_module_path = _Path(__file__).resolve().parent.parent / "chat.py"
_legacy_module = None


def _load_legacy_module():
    """Load the legacy ``chat.py`` once, on first access."""
    global _legacy_module
    if _legacy_module is not None:
        return _legacy_module
    spec = _importlib_util.spec_from_file_location(
        "app.services._chat_module_legacy", _chat_module_path
    )
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load chat module from {_chat_module_path}")
    module = _importlib_util.module_from_spec(spec)
    _sys.modules["app.services._chat_module_legacy"] = module
    spec.loader.exec_module(module)
    _legacy_module = module
    return module


def __getattr__(name: str):
    """Lazy attribute access for legacy ``chat.py`` symbols."""
    if name in _LEGACY_NAMES:
        return getattr(_load_legacy_module(), name)
    raise AttributeError(f"module 'app.services.chat' has no attribute {name!r}")


def __dir__():
    return sorted(list(globals().keys()) + list(_LEGACY_NAMES))


__all__ = [
    "BuiltContext",
    "ContextBuilder",
    "ContextResult",
    "ContextProvider",
    "ProviderContext",
    "build_chat_context",
    "build_chat_context_with_budget",
    "run_provider",
    *_LEGACY_NAMES,
]
