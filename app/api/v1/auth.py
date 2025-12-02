from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_active_user, get_current_user_with_role
from app.models.user import User
from app.schema.user import UserCreate, UserResponse
from fastapi.responses import JSONResponse

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """教师注册"""
    # 检查用户名是否已存在
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已存在"
        )

    try:
        # 哈希密码
        hashed_password = get_password_hash(str(user_data.password))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码哈希失败"
        )

    # 创建用户
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name
    )

    try:
        # 保存到数据库
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "数据库操作失败"}
        )
    return UserResponse.model_validate(db_user)


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """登录，返回JWT Token"""
    # 根据用户名查找用户
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # 验证用户是否存在且密码正确
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 生成访问令牌
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": str(settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)  # 单位：秒
    }


@router.post("/logout")
async def logout():
    """退出登录"""
    return {"message": "退出登录功能待实现"}


@router.post("/refresh")
async def refresh_token():
    """刷新Token"""
    return {"access_token": "mock-refreshed-token", "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """测试获取当前用户信息（需要认证）"""
    return current_user


@router.get("/test/teacher")
async def test_teacher_role(current_user: User = Depends(lambda: get_current_user_with_role("teacher"))):
    """测试教师角色访问（需要教师角色）"""
    return {"message": f"Welcome, teacher {current_user.username}!", "user_id": current_user.id}


@router.get("/test/admin")
async def test_admin_role(current_user: User = Depends(lambda: get_current_user_with_role("admin"))):
    """测试管理员角色访问（需要管理员角色）"""
    return {"message": f"Welcome, admin {current_user.username}!", "user_id": current_user.id}
