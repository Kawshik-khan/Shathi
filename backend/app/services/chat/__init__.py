"""Modular chat context package.

This subpackage holds the new modular context-builder pipeline introduced
in the 2026-06-25 streaming refactor. The public entrypoint is
``builder.build_chat_context``; legacy callers can still import
``app.services.chat_context.build_chat_context`` (now a thin shim).
"""
from __future__ import annotations

# Re-export the streaming entrypoint that historically lived in the
# ``app/services/chat.py`` module. Because Python resolves
# ``app.services.chat`` to this subpackage first, the module-level
# function must be imported via its file path to remain reachable as
# ``app.services.chat.send_chat_message_stream``.
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

_chat_module_path = _Path(__file__).resolve().parent.parent / "chat.py"
_spec = _importlib_util.spec_from_file_location(
    "app.services._chat_module_legacy", _chat_module_path
)
if _spec is None or _spec.loader is None:
    raise ImportError(f"Cannot load chat module from {_chat_module_path}")
_chat_module = _importlib_util.module_from_spec(_spec)
_sys.modules["app.services._chat_module_legacy"] = _chat_module
_spec.loader.exec_module(_chat_module)

send_chat_message_stream = _chat_module.send_chat_message_stream
send_chat_message = _chat_module.send_chat_message

__all__ = [
    "BuiltContext",
    "ContextBuilder",
    "ContextResult",
    "ContextProvider",
    "ProviderContext",
    "build_chat_context",
    "build_chat_context_with_budget",
    "run_provider",
    "send_chat_message_stream",
    "send_chat_message",
]
