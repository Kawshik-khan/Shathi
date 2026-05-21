"""Add performance indexes for chat context fetches

Revision ID: 007
Revises: 006
Create Date: 2026-05-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute(
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS
            idx_messages_conv_created_desc
            ON messages (conversation_id, created_at DESC)
            """
        )
        op.execute(
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS
            idx_mood_logs_user_logged_desc
            ON mood_logs (user_id, logged_at DESC)
            """
        )
        op.execute(
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS
            idx_journals_user_written_desc
            ON journals (user_id, written_at DESC)
            """
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_journals_user_written_desc")
        op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_mood_logs_user_logged_desc")
        op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_messages_conv_created_desc")
