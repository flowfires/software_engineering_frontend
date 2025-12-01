from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict

router = APIRouter()


@router.post("/register")
async def register():
    """教师注册"""
    return {"message": "注册功能待实现"}


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Dict[str, str]:
    """登录，返回JWT Token"""
    return {"access_token": "mock-token", "token_type": "bearer"}


@router.post("/logout")
async def logout():
    """退出登录"""
    return {"message": "退出登录功能待实现"}


@router.post("/refresh")
async def refresh_token():
    """刷新Token"""
    return {"access_token": "mock-refreshed-token", "token_type": "bearer"}
