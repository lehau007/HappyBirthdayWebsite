"""add ON DELETE CASCADE to poems and feedbacks user_id FK

Revision ID: 0002_cascade_fks
Revises: 0001_initial
Create Date: 2026-03-10

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0002_cascade_fks"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # poems.user_id — add ON DELETE CASCADE
    op.drop_constraint("poems_user_id_fkey", "poems", type_="foreignkey")
    op.create_foreign_key(
        "poems_user_id_fkey",
        "poems", "normal_users",
        ["user_id"], ["id"],
        ondelete="CASCADE",
    )

    # feedbacks.user_id — add ON DELETE CASCADE
    op.drop_constraint("feedbacks_user_id_fkey", "feedbacks", type_="foreignkey")
    op.create_foreign_key(
        "feedbacks_user_id_fkey",
        "feedbacks", "normal_users",
        ["user_id"], ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    # feedbacks.user_id — remove CASCADE
    op.drop_constraint("feedbacks_user_id_fkey", "feedbacks", type_="foreignkey")
    op.create_foreign_key(
        "feedbacks_user_id_fkey",
        "feedbacks", "normal_users",
        ["user_id"], ["id"],
    )

    # poems.user_id — remove CASCADE
    op.drop_constraint("poems_user_id_fkey", "poems", type_="foreignkey")
    op.create_foreign_key(
        "poems_user_id_fkey",
        "poems", "normal_users",
        ["user_id"], ["id"],
    )
