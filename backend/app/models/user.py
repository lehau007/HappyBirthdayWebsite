import enum
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    root_admin = "root_admin"
    admin = "admin"
    normal_user = "normal_user"


class RootAdmin(Base):
    __tablename__ = "root_admins"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    admins: Mapped[list["Admin"]] = relationship("Admin", back_populates="created_by_root")


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by_root_id: Mapped[int | None] = mapped_column(ForeignKey("root_admins.id"), nullable=True)

    created_by_root: Mapped["RootAdmin | None"] = relationship("RootAdmin", back_populates="admins")
    users: Mapped[list["NormalUser"]] = relationship("NormalUser", back_populates="admin")
    feedbacks: Mapped[list["Feedback"]] = relationship("Feedback", back_populates="admin")


class NormalUser(Base):
    __tablename__ = "normal_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    birthday_info: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    admin_id: Mapped[int] = mapped_column(ForeignKey("admins.id"), nullable=False)

    admin: Mapped["Admin"] = relationship("Admin", back_populates="users")
    poem: Mapped["Poem | None"] = relationship("Poem", back_populates="user", uselist=False, passive_deletes=True)
    feedbacks: Mapped[list["Feedback"]] = relationship("Feedback", back_populates="user", passive_deletes=True)


class TokenBlacklist(Base):
    """Stores revoked JWT tokens until they naturally expire."""
    __tablename__ = "token_blacklist"

    id: Mapped[int] = mapped_column(primary_key=True)
    jti: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
    revoked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
