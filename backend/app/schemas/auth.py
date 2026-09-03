from pydantic import BaseModel, EmailStr

from app.schemas.user import UserOut


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    user: UserOut
