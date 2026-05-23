"""Add chat token usage tracking

Revision ID: 012
Revises: 011
Create Date: 2026-05-23 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chat_token_usage",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "conversation_id",
            sa.String(36),
            sa.ForeignKey("conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_message_id",
            sa.String(36),
            sa.ForeignKey("messages.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "assistant_message_id",
            sa.String(36),
            sa.ForeignKey("messages.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("model_used", sa.String(80), nullable=True),
        sa.Column("input_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("output_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cache_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("usage_source", sa.String(30), nullable=False, server_default="estimated"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_chat_token_usage_user_id", "chat_token_usage", ["user_id"])
    op.create_index("ix_chat_token_usage_conversation_id", "chat_token_usage", ["conversation_id"])
    op.create_index("ix_chat_token_usage_user_message_id", "chat_token_usage", ["user_message_id"])
    op.create_index(
        "ix_chat_token_usage_assistant_message_id",
        "chat_token_usage",
        ["assistant_message_id"],
        unique=True,
    )
    op.create_index(
        "ix_chat_token_usage_user_created",
        "chat_token_usage",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_chat_token_usage_conversation_created",
        "chat_token_usage",
        ["conversation_id", "created_at"],
    )
    op.create_index("ix_chat_token_usage_total_tokens", "chat_token_usage", ["total_tokens"])


def downgrade() -> None:
    op.drop_index("ix_chat_token_usage_total_tokens", table_name="chat_token_usage")
    op.drop_index("ix_chat_token_usage_conversation_created", table_name="chat_token_usage")
    op.drop_index("ix_chat_token_usage_user_created", table_name="chat_token_usage")
    op.drop_index("ix_chat_token_usage_assistant_message_id", table_name="chat_token_usage")
    op.drop_index("ix_chat_token_usage_user_message_id", table_name="chat_token_usage")
    op.drop_index("ix_chat_token_usage_conversation_id", table_name="chat_token_usage")
    op.drop_index("ix_chat_token_usage_user_id", table_name="chat_token_usage")
    op.drop_table("chat_token_usage")
