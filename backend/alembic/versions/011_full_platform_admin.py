"""Expand full platform admin support

Revision ID: 011
Revises: 010
Create Date: 2026-05-22 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("crisis_resources", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("crisis_resources", sa.Column("url", sa.String(500), nullable=True))
    op.add_column(
        "crisis_resources",
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "crisis_resources",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index("ix_crisis_resources_active", "crisis_resources", ["active"])

    op.add_column(
        "community_posts",
        sa.Column("moderation_status", sa.String(30), nullable=False, server_default="visible"),
    )
    op.add_column("community_posts", sa.Column("moderation_reason", sa.Text(), nullable=True))
    op.add_column("community_posts", sa.Column("hidden_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "community_posts",
        sa.Column(
            "hidden_by",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("community_posts", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_community_posts_moderation_status", "community_posts", ["moderation_status"])
    op.create_index("ix_community_posts_hidden_by", "community_posts", ["hidden_by"])

    op.create_table(
        "safety_reviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "message_id",
            sa.String(36),
            sa.ForeignKey("messages.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("status", sa.String(30), nullable=False, server_default="open"),
        sa.Column("escalation_level", sa.String(30), nullable=True),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column(
            "reviewed_by",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_safety_reviews_message_id", "safety_reviews", ["message_id"])
    op.create_index("ix_safety_reviews_status", "safety_reviews", ["status"])
    op.create_index("ix_safety_reviews_escalation_level", "safety_reviews", ["escalation_level"])
    op.create_index("ix_safety_reviews_reviewed_by", "safety_reviews", ["reviewed_by"])


def downgrade() -> None:
    op.drop_index("ix_safety_reviews_reviewed_by", table_name="safety_reviews")
    op.drop_index("ix_safety_reviews_escalation_level", table_name="safety_reviews")
    op.drop_index("ix_safety_reviews_status", table_name="safety_reviews")
    op.drop_index("ix_safety_reviews_message_id", table_name="safety_reviews")
    op.drop_table("safety_reviews")

    op.drop_index("ix_community_posts_hidden_by", table_name="community_posts")
    op.drop_index("ix_community_posts_moderation_status", table_name="community_posts")
    op.drop_column("community_posts", "reviewed_at")
    op.drop_column("community_posts", "hidden_by")
    op.drop_column("community_posts", "hidden_at")
    op.drop_column("community_posts", "moderation_reason")
    op.drop_column("community_posts", "moderation_status")

    op.drop_index("ix_crisis_resources_active", table_name="crisis_resources")
    op.drop_column("crisis_resources", "updated_at")
    op.drop_column("crisis_resources", "active")
    op.drop_column("crisis_resources", "url")
    op.drop_column("crisis_resources", "description")
