from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """用户基础模型"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名（3-50个字符）")
    email: EmailStr = Field(..., description="邮箱")
    full_name: Optional[str] = Field(None, max_length=100, description="真实姓名(可选，最大100个字符)")


class UserCreate(UserBase):
    """用户创建模型（注册用）"""
    password: str = Field(..., min_length=6, max_length=50, description="密码（6-50个字符）")


class UserLogin(BaseModel):
    """用户登录模型"""
    username: str = Field(..., description="用户名（3-50个字符）")
    password: str = Field(..., description="密码（6-50个字符）")


class UserResponse(UserBase):
    """用户响应模型"""
    id: int
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """令牌响应模型"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """令牌数据模型"""
    user_id: Optional[int] = None
