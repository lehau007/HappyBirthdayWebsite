import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class FeedbackCreate(BaseModel):
    type: Literal["reaction", "thankyou", "text"]
    content: str = Field(min_length=1, max_length=500)

    @field_validator("content", mode="before")
    @classmethod
    def strip_html(cls, v: object) -> object:
        """Strip HTML/script tags before length validation to prevent XSS storage."""
        if isinstance(v, str):
            v = re.sub(r"<[^>]+>", "", v).strip()
        return v


class FeedbackOut(BaseModel):
    id: int
    feedback_type: str
    content: str
    created_at: datetime
    is_read: bool
    username: str

    model_config = {"from_attributes": True}
