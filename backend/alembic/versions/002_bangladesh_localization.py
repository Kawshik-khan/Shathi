"""Bangladesh localization features

Revision ID: 002
Revises: 001
Create Date: 2026-05-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "families",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.add_column("users", sa.Column("language", sa.String(10), nullable=False, server_default="en"))
    op.add_column("users", sa.Column("family_id", sa.String(36), nullable=True))
    op.create_foreign_key(
        "fk_users_family_id_families",
        "users",
        "families",
        ["family_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "localized_content",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("content_type", sa.String(50), nullable=False),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("region", sa.String(50), nullable=True),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_localized_content_content_type", "localized_content", ["content_type"])
    op.create_index("ix_localized_content_language", "localized_content", ["language"])
    op.create_index("ix_localized_content_region", "localized_content", ["region"])
    op.create_index("ix_localized_content_published", "localized_content", ["published"])

    op.create_table(
        "crisis_resources",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("region", sa.String(50), nullable=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("language", sa.String(10), nullable=False, server_default="bn"),
        sa.Column("is_24_7", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_crisis_resources_region", "crisis_resources", ["region"])
    op.create_index("ix_crisis_resources_type", "crisis_resources", ["type"])

    op.create_table(
        "academic_tracking",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stress_level", sa.Integer(), nullable=True),
        sa.Column("exam_date", sa.Date(), nullable=True),
        sa.Column("subject", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_academic_tracking_user_id", "academic_tracking", ["user_id"])
    op.create_index("ix_academic_tracking_exam_date", "academic_tracking", ["exam_date"])

    op.create_table(
        "family_activities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("family_id", sa.String(36), sa.ForeignKey("families.id", ondelete="CASCADE"), nullable=False),
        sa.Column("activity_type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("scheduled_date", sa.Date(), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_family_activities_family_id", "family_activities", ["family_id"])

    op.create_table(
        "communities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("region", sa.String(50), nullable=True),
        sa.Column("language", sa.String(10), nullable=False, server_default="bn"),
        sa.Column("type", sa.String(50), nullable=False, server_default="support_group"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_communities_region", "communities", ["region"])

    op.create_table(
        "community_posts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("community_id", sa.String(36), sa.ForeignKey("communities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("language", sa.String(10), nullable=False, server_default="bn"),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_community_posts_user_id", "community_posts", ["user_id"])
    op.create_index("ix_community_posts_community_id", "community_posts", ["community_id"])

    op.create_table(
        "community_members",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("community_id", sa.String(36), sa.ForeignKey("communities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "community_id", name="uq_community_members_user_community"),
    )
    op.create_index("ix_community_members_user_id", "community_members", ["user_id"])
    op.create_index("ix_community_members_community_id", "community_members", ["community_id"])

    for table_name in (
        "families",
        "localized_content",
        "crisis_resources",
        "academic_tracking",
        "family_activities",
        "communities",
        "community_posts",
        "community_members",
    ):
        op.execute(f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_index("ix_community_members_community_id", table_name="community_members")
    op.drop_index("ix_community_members_user_id", table_name="community_members")
    op.drop_table("community_members")
    op.drop_index("ix_community_posts_community_id", table_name="community_posts")
    op.drop_index("ix_community_posts_user_id", table_name="community_posts")
    op.drop_table("community_posts")
    op.drop_index("ix_communities_region", table_name="communities")
    op.drop_table("communities")
    op.drop_index("ix_family_activities_family_id", table_name="family_activities")
    op.drop_table("family_activities")
    op.drop_index("ix_academic_tracking_exam_date", table_name="academic_tracking")
    op.drop_index("ix_academic_tracking_user_id", table_name="academic_tracking")
    op.drop_table("academic_tracking")
    op.drop_index("ix_crisis_resources_type", table_name="crisis_resources")
    op.drop_index("ix_crisis_resources_region", table_name="crisis_resources")
    op.drop_table("crisis_resources")
    op.drop_index("ix_localized_content_published", table_name="localized_content")
    op.drop_index("ix_localized_content_region", table_name="localized_content")
    op.drop_index("ix_localized_content_language", table_name="localized_content")
    op.drop_index("ix_localized_content_content_type", table_name="localized_content")
    op.drop_table("localized_content")
    op.drop_constraint("fk_users_family_id_families", "users", type_="foreignkey")
    op.drop_column("users", "family_id")
    op.drop_column("users", "language")
    op.drop_table("families")
