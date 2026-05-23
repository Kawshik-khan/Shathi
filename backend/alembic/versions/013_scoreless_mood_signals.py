"""Add scoreless mood signal tables

Revision ID: 013
Revises: 012
Create Date: 2026-05-23 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "mood_reflections",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("prompt", sa.String(240), nullable=True),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("emotion_detected", sa.String(50), nullable=True),
        sa.Column("emotion_confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_mood_reflections_user_id", "mood_reflections", ["user_id"])
    op.create_index(
        "ix_mood_reflections_user_created",
        "mood_reflections",
        ["user_id", "created_at"],
    )

    op.create_table(
        "app_activity_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("event_metadata", sa.JSON(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_app_activity_events_user_id", "app_activity_events", ["user_id"])
    op.create_index("ix_app_activity_events_occurred_at", "app_activity_events", ["occurred_at"])
    op.create_index(
        "ix_app_activity_events_user_occurred",
        "app_activity_events",
        ["user_id", "occurred_at"],
    )
    op.create_index(
        "ix_app_activity_events_user_type",
        "app_activity_events",
        ["user_id", "event_type"],
    )

    op.create_table(
        "sleep_timing_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("slept_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("woke_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("quality_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_sleep_timing_entries_user_id", "sleep_timing_entries", ["user_id"])
    op.create_index(
        "ix_sleep_timing_entries_user_slept",
        "sleep_timing_entries",
        ["user_id", "slept_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_sleep_timing_entries_user_slept", table_name="sleep_timing_entries")
    op.drop_index("ix_sleep_timing_entries_user_id", table_name="sleep_timing_entries")
    op.drop_table("sleep_timing_entries")

    op.drop_index("ix_app_activity_events_user_type", table_name="app_activity_events")
    op.drop_index("ix_app_activity_events_user_occurred", table_name="app_activity_events")
    op.drop_index("ix_app_activity_events_occurred_at", table_name="app_activity_events")
    op.drop_index("ix_app_activity_events_user_id", table_name="app_activity_events")
    op.drop_table("app_activity_events")

    op.drop_index("ix_mood_reflections_user_created", table_name="mood_reflections")
    op.drop_index("ix_mood_reflections_user_id", table_name="mood_reflections")
    op.drop_table("mood_reflections")
