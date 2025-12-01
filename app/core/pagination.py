from typing import Generic, TypeVar, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Query
from fastapi import Query as FastAPIQuery

T = TypeVar('T')


class PaginationParams(BaseModel):
    """分页参数模型"""
    page: int = Field(1, ge=1, description="页码，从1开始")
    page_size: int = Field(10, ge=1, le=100, description="每页条数，最大100")
    
    @property
    def offset(self) -> int:
        """计算偏移量"""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """获取限制条数"""
        return self.page_size


class PaginationResult(BaseModel, Generic[T]):
    """分页结果模型"""
    items: List[T] = Field(..., description="数据列表")
    total: int = Field(..., description="总条数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页条数")
    pages: int = Field(..., description="总页数")
    
    @classmethod
    def create(cls, items: List[T], total: int, page: int, page_size: int) -> "PaginationResult[T]":
        """创建分页结果"""
        pages = (total + page_size - 1) // page_size
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages
        )


async def get_pagination_params(
    page: int = FastAPIQuery(1, ge=1, description="页码，从1开始"),
    page_size: int = FastAPIQuery(10, ge=1, le=100, description="每页条数，最大100")
) -> PaginationParams:
    """获取分页参数的依赖注入函数"""
    return PaginationParams(page=page, page_size=page_size)


def paginate_query(query: Query, pagination: PaginationParams) -> Query:
    """分页查询助手"""
    return query.offset(pagination.offset).limit(pagination.limit)


def paginate_dict_list(data: List[Dict[str, Any]], pagination: PaginationParams) -> Dict[str, Any]:
    """对字典列表进行分页"""
    total = len(data)
    items = data[pagination.offset:pagination.offset + pagination.limit]
    pages = (total + pagination.page_size - 1) // pagination.page_size
    
    return {
        "items": items,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "pages": pages
    }
