import logging
import os
from typing import Callable
from fastapi import Request, Response
from fastapi.routing import APIRoute
from datetime import datetime

# 日志级别
LOG_LEVEL = logging.INFO

# 日志格式
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# 日志目录
LOG_DIR = "logs"

# 确保日志目录存在
os.makedirs(LOG_DIR, exist_ok=True)

# 配置根日志
logging.basicConfig(
    level=LOG_LEVEL,
    format=LOG_FORMAT,
    handlers=[
        # 控制台日志处理器
        logging.StreamHandler(),
        # 文件日志处理器
        logging.FileHandler(os.path.join(LOG_DIR, "app.log"), encoding="utf-8")
    ]
)


def get_logger(name: str) -> logging.Logger:
    """获取日志记录器"""
    return logging.getLogger(name)


class LoggingMiddleware:
    """日志中间件，记录请求和响应信息"""
    
    def __init__(self, app):
        self.app = app
        self.logger = get_logger("fastapi.request")
    
    async def __call__(self, request: Request, call_next) -> Response:
        # 记录请求开始时间
        start_time = datetime.now()
        
        # 记录请求信息
        self.logger.info(
            f"Request: {request.method} {request.url.path} - Headers: {dict(request.headers)}"
        )
        
        # 处理请求
        response = await call_next(request)
        
        # 计算请求处理时间
        process_time = (datetime.now() - start_time).total_seconds()
        
        # 记录响应信息
        self.logger.info(
            f"Response: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s"
        )
        
        return response


class LoggingRoute(APIRoute):
    """日志路由，记录每个路由的请求和响应"""
    
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()
        logger = get_logger("fastapi.route")
        
        async def custom_route_handler(request: Request) -> Response:
            # 记录请求信息
            logger.info(
                f"Route Request: {request.method} {request.url.path} - Params: {dict(request.query_params)}"
            )
            
            # 处理请求
            response = await original_route_handler(request)
            
            # 记录响应信息
            logger.info(
                f"Route Response: {request.method} {request.url.path} - Status: {response.status_code}"
            )
            
            return response
        
        return custom_route_handler
