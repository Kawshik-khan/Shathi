"""Add ``token_version`` to ``users`` for session invalidation (P1 1.2).

The column defaults to 0 so every existing user continues to validate
their current (un-stamped) tokens as ``tv=0``. After P1 ships, all
newly issued tokens carry the current ``token_version``; bumping it
(password change, forced logout, account-takeover recovery) silently
retires every outstanding access *and* refresh token for that user.

Revision ID: 015
Revises: 014
Create Date: 2026-08-04 00:00:00.000000

Revision ID: 015
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ``server_default="0"`` plus ``nullable=False`` so the column is
    # safe for both new inserts and the existing row population that
    # happens on the very next SELECT against the live table. The
    # default is also accepted by ``User.token_version``'s
    # ``default=0`` so a race between an old INSERT (no value) and a
    # new SELECT (column) cannot land on ``NOT NULL`` violation.
    op.add_column(
        "users",
        sa.Column(
            "token_version",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "token_version")
