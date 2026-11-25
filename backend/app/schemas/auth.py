from pydantic import BaseModel
from typing import Optional

class WorkerLoginRequest(BaseModel):
    phone: str
    pin: str

class AdminLoginRequest(BaseModel):
    phone: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
