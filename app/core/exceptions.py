# app/core/exceptions.py

from fastapi import HTTPException, status


# 1. 自定义业务异常基类
class APIException(HTTPException):
    """
    所有自定义 HTTP 异常的基类
    """

    def __init__(self, status_code: int, detail: str, headers: dict | None = None):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


# 2. 常见业务异常
class NotFoundException(APIException):
    """资源未找到 (404)"""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class BadRequestException(APIException):
    """请求参数错误 (400)"""

    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class InternalServerErrorException(APIException):
    """服务器内部错误 (500)"""

    def __init__(self, detail: str = "Internal server error"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)