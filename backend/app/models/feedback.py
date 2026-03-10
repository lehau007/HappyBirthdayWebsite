import enum
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FeedbackType(str, enum.Enum):
    reaction = "reaction"
    thankyou = "thankyou"
    text = "text"


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("normal_users.id", ondelete="CASCADE"), nullable=False)
    admin_id: Mapped[int] = mapped_column(ForeignKey("admins.id"), nullable=False)
    feedback_type: Mapped[FeedbackType] = mapped_column(
        SAEnum(FeedbackType, name="feedbacktype"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)

    user: Mapped["NormalUser"] = relationship("NormalUser", back_populates="feedbacks")
    admin: Mapped["Admin"] = relationship("Admin", back_populates="feedbacks")
