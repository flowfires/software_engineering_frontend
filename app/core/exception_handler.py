# app/core/exception_handlers.py

import traceback
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .exceptions import APIException  # 导入我们自定义的异常基类


# 统一的响应体结构 (假设在 app/schema/response.py 中定义)
# 为简洁起见, 这里直接定义响应 JSON 结构
def generate_error_response(status_code: int, message: str, errors: list | None = None):
    return {
        "success": False,
        "code": status_code,
        "message": message,
        "errors": errors if errors else []
    }


# --- 处理器定义 ---

# 1. 处理自定义的 APIException
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content=generate_error_response(
            status_code=exc.status_code,
            message=exc.detail
        )
    )


# 2. 处理 Pydantic 模型校验错误 (HTTP 422)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # 提取 Pydantic 的详细错误信息，通常包含字段名和错误原因
    error_list = [
        {"loc": error["loc"], "msg": error["msg"], "type": error["type"]}
        for error in exc.errors()
    ]

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=generate_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message="Input data validation error.",
            errors=error_list
        )
    )


# 3. 处理所有内置的 HTTPException (如 404, 405, 401 等)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=generate_error_response(
            status_code=exc.status_code,
            message=exc.detail
        )
    )


# 4. 捕获未处理的通用 Python 异常 (兜底)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # **重要**: 在实际生产环境中，请务必记录堆栈信息
    traceback.print_exc()

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=generate_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message="An unexpected server error occurred."
        )
    )


# 注册异常处理器的函数
def register_exception_handlers(app: FastAPI):
    app.add_exception_handler(APIException, api_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)