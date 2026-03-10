"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-03-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # root_admins
    op.create_table(
        "root_admins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(64), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(256), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_root_admins_username", "root_admins", ["username"])

    # admins
    op.create_table(
        "admins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(64), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(256), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_by_root_id", sa.Integer(), sa.ForeignKey("root_admins.id"), nullable=True),
    )
    op.create_index("ix_admins_username", "admins", ["username"])

    # normal_users
    op.create_table(
        "normal_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(64), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(256), nullable=False),
        sa.Column("birthday_info", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("admin_id", sa.Integer(), sa.ForeignKey("admins.id"), nullable=False),
    )
    op.create_index("ix_normal_users_username", "normal_users", ["username"])

    # poems
    op.create_table(
        "poems",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("normal_users.id"), unique=True, nullable=False),
        sa.Column("poem_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # feedbacks
    op.create_table(
        "feedbacks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("normal_users.id"), nullable=False),
        sa.Column("admin_id", sa.Integer(), sa.ForeignKey("admins.id"), nullable=False),
        sa.Column("feedback_type", sa.Enum("reaction", "thankyou", "text", name="feedbacktype", create_type=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
    )

    # token_blacklist
    op.create_table(
        "token_blacklist",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("jti", sa.String(256), unique=True, nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_token_blacklist_jti", "token_blacklist", ["jti"])


def downgrade() -> None:
    op.drop_table("token_blacklist")
    op.drop_table("feedbacks")
    op.drop_index("ix_normal_users_username", "normal_users")
    op.drop_table("normal_users")
    op.drop_table("poems")
    op.drop_index("ix_admins_username", "admins")
    op.drop_table("admins")
    op.drop_index("ix_root_admins_username", "root_admins")
    op.drop_table("root_admins")
    sa.Enum(name="feedbacktype").drop(op.get_bind())
