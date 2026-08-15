from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    student_id: Optional[str] = None
    role: Optional[str] = "student"
    program: Optional[str] = "MCA"
    semester: Optional[int] = 2
    department: Optional[str] = "Computer Applications"
    batch: Optional[str] = "2025-2027"

class UserOut(BaseModel):
    id: int
    student_id: Optional[str]
    name: str
    email: str
    role: str
    program: Optional[str]
    semester: Optional[int]
    department: Optional[str]
    batch: Optional[str]

    class Config:
        from_attributes = True
