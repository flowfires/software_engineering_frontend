# from typing import Generic, TypeVar, Optional
# from pydantic import BaseModel
# from fastapi import Response
#
# T = TypeVar('T')
#
#
# class ResponseModel(BaseModel, Generic[T]):
#     """自定义响应模型"""
#     code: int = 200
#     message: str = "success"
#     data: Optional[T] = None
#
#     class Config:
#         arbitrary_types_allowed = True
#
#
# def success_response(data: Optional[T] = None, message: str = "success") -> ResponseModel:
#     """成功响应"""
#     return ResponseModel(code=200, message=message, data=data)
#
#
# def error_response(code: int = 400, message: str = "error") -> ResponseModel:
#     """错误响应"""
#     return ResponseModel(code=code, message=message, data=None)
#
#
# def pagination_response(data: list, total: int, page: int, page_size: int) -> ResponseModel:
#     """分页响应"""
#     return ResponseModel(
#         code=200,
#         message="success",
#         data={
#             "items": data,
#             "total": total,
#             "page": page,
#             "page_size": page_size,
#             "pages": (total + page_size - 1) // page_size
#         }
#     )
