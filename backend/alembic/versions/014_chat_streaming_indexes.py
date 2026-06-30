"""Add composite DESC indexes for chat streaming context fetches

These indexes match the query shapes used by the new parallel context
providers: sleep_timing_entries, mood_reflections, app_activity_events,
and habit_completions are all queried with ``WHERE user_id = :id
ORDER BY <timestamp> DESC LIMIT N``. The composite (user_id, ts DESC)
form lets Postgres satisfy each query from an index-only scan without
sorting.

Revision ID: 014
Revises: 013
Create Date: 2026-06-25 00:00:00.000000

Note: this migration deliberately omits the ``CONCURRENTLY`` keyword.
Alembic wraps each migration in a transaction by default, and Postgres
forbids ``CREATE INDEX CONCURRENTLY`` inside a transaction block. The
tables are empty on first apply, so the ``AccessExclusiveLock`` taken
by the plain ``CREATE INDEX`` is instantaneous and harmless; re-apply
semantics are preserved via ``IF NOT EXISTS``.

Revision ID: 014
"""
from typing import Sequence, Union

from alembic import op


revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_sleep_user_slept_desc
        ON sleep_timing_entries (user_id, slept_at DESC)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_mood_reflections_user_created_desc
        ON mood_reflections (user_id, created_at DESC)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_app_activity_user_occurred_desc
        ON app_activity_events (user_id, occurred_at DESC)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_completed_desc
        ON habit_completions (habit_id, completed_at DESC)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_habit_completions_habit_completed_desc")
    op.execute("DROP INDEX IF EXISTS idx_app_activity_user_occurred_desc")
    op.execute("DROP INDEX IF EXISTS idx_mood_reflections_user_created_desc")
    op.execute("DROP INDEX IF EXISTS idx_sleep_user_slept_desc")
