from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    role: str


class LogoutRequest(BaseModel):
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserMe(BaseModel):
    id: int
    username: str
    role: str

    model_config = {"from_attributes": True}
