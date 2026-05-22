"""Add roles, subscriptions, and usage events

Revision ID: 008
Revises: 007
Create Date: 2026-05-22 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("system_role", sa.String(30), nullable=False, server_default="user"),
    )
    op.add_column(
        "users",
        sa.Column("plan", sa.String(30), nullable=False, server_default="free"),
    )
    op.add_column(
        "users",
        sa.Column(
            "subscription_status",
            sa.String(30),
            nullable=False,
            server_default="active",
        ),
    )
    op.add_column(
        "users",
        sa.Column("subscription_started_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("subscription_ends_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("billing_customer_id", sa.String(255), nullable=True),
    )
    op.add_column("users", sa.Column("family_role", sa.String(30), nullable=True))
    op.create_index("ix_users_billing_customer_id", "users", ["billing_customer_id"])
    op.add_column(
        "community_members",
        sa.Column("role", sa.String(30), nullable=False, server_default="member"),
    )

    op.create_table(
        "usage_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("feature_key", sa.String(80), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_usage_events_user_id", "usage_events", ["user_id"])
    op.create_index("ix_usage_events_feature_key", "usage_events", ["feature_key"])
    op.create_index(
        "ix_usage_events_user_feature_period",
        "usage_events",
        ["user_id", "feature_key", "period_start"],
    )


def downgrade() -> None:
    op.drop_index("ix_usage_events_user_feature_period", table_name="usage_events")
    op.drop_index("ix_usage_events_feature_key", table_name="usage_events")
    op.drop_index("ix_usage_events_user_id", table_name="usage_events")
    op.drop_table("usage_events")
    op.drop_index("ix_users_billing_customer_id", table_name="users")
    op.drop_column("community_members", "role")
    op.drop_column("users", "billing_customer_id")
    op.drop_column("users", "family_role")
    op.drop_column("users", "subscription_ends_at")
    op.drop_column("users", "subscription_started_at")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "plan")
    op.drop_column("users", "system_role")
