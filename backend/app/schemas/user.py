from datetime import datetime

from pydantic import BaseModel, Field


class AdminCreate(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class AdminOut(BaseModel):
    id: int
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    birthday_info: str | None = Field(default=None, max_length=512)


class UserOut(BaseModel):
    id: int
    username: str
    birthday_info: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
