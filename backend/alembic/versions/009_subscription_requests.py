"""Add manual subscription requests

Revision ID: 009
Revises: 008
Create Date: 2026-05-22 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "subscription_requests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("requested_plan", sa.String(30), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("message", sa.Text(), nullable=True),
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
    op.create_index("ix_subscription_requests_user_id", "subscription_requests", ["user_id"])
    op.create_index(
        "ix_subscription_requests_requested_plan",
        "subscription_requests",
        ["requested_plan"],
    )
    op.create_index("ix_subscription_requests_status", "subscription_requests", ["status"])


def downgrade() -> None:
    op.drop_index("ix_subscription_requests_status", table_name="subscription_requests")
    op.drop_index("ix_subscription_requests_requested_plan", table_name="subscription_requests")
    op.drop_index("ix_subscription_requests_user_id", table_name="subscription_requests")
    op.drop_table("subscription_requests")
