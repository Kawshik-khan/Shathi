"""User profile fields

Revision ID: 005
Revises: 004
Create Date: 2026-05-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="Asia/Dhaka"),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(40), nullable=True),
        sa.Column("wellness_goals", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("preferred_support_style", sa.String(80), nullable=True),
        sa.Column("emergency_contact_name", sa.String(120), nullable=True),
        sa.Column("emergency_contact_phone", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_user_profiles_user_id", "user_profiles", ["user_id"])
    op.execute("ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_index("ix_user_profiles_user_id", table_name="user_profiles")
    op.drop_table("user_profiles")
