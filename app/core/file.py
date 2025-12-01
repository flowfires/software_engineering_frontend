import os
import uuid
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from fastapi.responses import FileResponse
from app.core.config import settings


class FileHandler:
    """文件处理类"""
    
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_image_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        self.allowed_document_types = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        
        # 确保上传目录存在
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def validate_file(self, file: UploadFile, allowed_types: list, max_size: Optional[int] = None) -> None:
        """验证文件类型和大小"""
        # 验证文件类型
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的文件类型: {file.content_type}，允许的类型: {allowed_types}"
            )
        
        # 验证文件大小
        if max_size is None:
            max_size = self.max_file_size
        
        # 获取文件大小
        file.file.seek(0, 2)  # 移动到文件末尾
        file_size = file.file.tell()  # 获取文件大小
        file.file.seek(0)  # 重置文件指针到开头
        
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"文件大小超过限制: {file_size} bytes，最大允许: {max_size} bytes"
            )
    
    def generate_unique_filename(self, original_filename: str) -> str:
        """生成唯一文件名"""
        # 获取文件扩展名
        ext = os.path.splitext(original_filename)[1]
        # 生成唯一文件名
        unique_name = f"{uuid.uuid4()}{ext}"
        return unique_name
    
    async def save_file(self, file: UploadFile, allowed_types: list, max_size: Optional[int] = None) -> str:
        """保存文件到本地"""
        # 验证文件
        self.validate_file(file, allowed_types, max_size)
        
        # 生成唯一文件名
        filename = self.generate_unique_filename(file.filename)
        
        # 保存文件
        file_path = os.path.join(self.upload_dir, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        return filename
    
    def get_file_path(self, filename: str) -> str:
        """获取文件完整路径"""
        return os.path.join(self.upload_dir, filename)
    
    def file_exists(self, filename: str) -> bool:
        """检查文件是否存在"""
        file_path = self.get_file_path(filename)
        return os.path.exists(file_path)
    
    def delete_file(self, filename: str) -> bool:
        """删除文件"""
        file_path = self.get_file_path(filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    
    def get_file_response(self, filename: str, media_type: Optional[str] = None) -> FileResponse:
        """获取文件响应"""
        file_path = self.get_file_path(filename)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文件不存在"
            )
        
        return FileResponse(
            path=file_path,
            media_type=media_type,
            filename=filename
        )
    
    def validate_image(self, file: UploadFile) -> None:
        """验证图片文件"""
        self.validate_file(file, self.allowed_image_types)
    
    def validate_document(self, file: UploadFile) -> None:
        """验证文档文件"""
        self.validate_file(file, self.allowed_document_types)
    
    async def save_image(self, file: UploadFile) -> str:
        """保存图片文件"""
        return await self.save_file(file, self.allowed_image_types)
    
    async def save_document(self, file: UploadFile) -> str:
        """保存文档文件"""
        return await self.save_file(file, self.allowed_document_types)


# 创建文件处理器实例
file_handler = FileHandler()
