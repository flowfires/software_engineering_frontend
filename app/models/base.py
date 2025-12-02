from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.ext.declarative import declared_attr
from app.core.database import Base


class TimestampMixin:
    """时间戳混合类，提供创建时间和更新时间字段"""
    @declared_attr
    def created_at(cls):
        return Column(DateTime, server_default=func.now(), nullable=False)
    
    @declared_attr
    def updated_at(cls):
        return Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class BaseModel(Base, TimestampMixin):
    """模型基类，继承自SQLAlchemy的Base和TimestampMixin"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)


# app/schema/base_model.py

# from pydantic import BaseModel, FieldInfo, model_validator
from typing import Any


# class AutoDocModel(BaseModel):
#     """
#     自定义 Pydantic 基类，用于自动将 min_length, max_length 等约束
#     添加到字段的 description 中，以增强 FastAPI/Swagger 文档。
#     """
#
#     @classmethod
#     def model_json_schema(cls, **kwargs: Any) -> dict[str, Any]:
#         """
#         拦截 Pydantic 生成 JSON Schema 的过程，并在其中添加约束描述。
#         """
#         # 1. 首先调用 Pydantic 父类的 model_json_schema 得到原始 Schema
#         schema = super().model_json_schema(**kwargs)
#
#         # 确保 properties 存在
#         if 'properties' not in schema:
#             return schema
#
#         # 2. 遍历所有字段并注入描述
#         for field_name, field in cls.model_fields.items():
#             if field_name in schema['properties']:
#                 schema_property = schema['properties'][field_name]
#
#                 # 获取原始描述或初始化为空字符串
#                 original_description = field.description or ""
#
#                 # 构造约束描述列表
#                 constraints = []
#
#                 # --- 检查并添加长度约束 ---
#                 if field.json_schema_extra and 'min_length' in field.json_schema_extra:
#                     # 对于 v2 使用 json_schema_extra 访问
#                     constraints.append(f"最小长度: {field.json_schema_extra['min_length']}")
#                 if field.json_schema_extra and 'max_length' in field.json_schema_extra:
#                     constraints.append(f"最大长度: {field.json_schema_extra['max_length']}")
#
#                 # --- 检查并添加数值约束 ---
#                 if field.json_schema_extra and 'exclusiveMinimum' in field.json_schema_extra:
#                     constraints.append(f"必须大于: {field.json_schema_extra['exclusiveMinimum']}")
#                 # ... 您可以根据需要添加更多的约束检查 (gt, lt, ge, le) ...
#
#                 # 3. 将约束信息与原始描述合并
#                 if constraints:
#                     constraint_str = " (" + ", ".join(constraints) + ")"
#                     # 优先使用 field.description，如果为空则使用 title
#                     schema_property['description'] = (original_description or schema_property.get('title',
#                                                                                                   '')) + constraint_str
#
#         return schema