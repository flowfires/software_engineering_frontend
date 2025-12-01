import httpx
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.core.config import settings


class AIService:
    """AI服务调用类"""
    
    def __init__(self):
        self.api_key = settings.AI_API_KEY
        self.base_url = settings.AI_BASE_URL
        self.timeout = 30.0  # 请求超时时间
        
        # 创建HTTP客户端
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
    
    async def _send_request(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """发送AI请求的通用方法"""
        try:
            response = await self.client.post(endpoint, json=data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            # 处理HTTP错误
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI服务请求失败: {e.response.text}"
            )
        except Exception as e:
            # 处理其他错误
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI服务调用异常: {str(e)}"
            )
    
    async def generate_lesson(self, topic: str, template_type: str = "standard", **kwargs) -> Dict[str, Any]:
        """根据课题/模板生成完整教案"""
        endpoint = "/v1/chat/completions"
        # 构建提示词和请求数据
        prompt = f"根据以下课题生成完整教案，使用{template_type}模板：\n课题：{topic}"
        
        # 添加额外参数
        if kwargs:
            prompt += "\n额外要求："
            for key, value in kwargs.items():
                prompt += f"{key}: {value}; "
        
        data = {
            "model": "gpt-3.5-turbo",  # 根据实际AI服务模型调整
            "messages": [
                {"role": "system", "content": "你是一位经验丰富的教师，擅长编写高质量的教案。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        return await self._send_request(endpoint, data)
    
    async def expand_lesson(self, content: str, **kwargs) -> Dict[str, Any]:
        """扩展/补全教案段落"""
        endpoint = "/v1/chat/completions"
        prompt = f"请扩展以下教案内容：\n{content}"
        
        if kwargs:
            prompt += "\n扩展要求："
            for key, value in kwargs.items():
                prompt += f"{key}: {value}; "
        
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "你是一位经验丰富的教师，擅长扩展和完善教案内容。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        return await self._send_request(endpoint, data)
    
    async def optimize_lesson(self, content: str, style: str = "严谨") -> Dict[str, Any]:
        """优化教案风格/逻辑"""
        endpoint = "/v1/chat/completions"
        prompt = f"请优化以下教案，使其风格更加{style}，逻辑更加清晰：\n{content}"
        
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "你是一位经验丰富的教师，擅长优化教案的风格和逻辑。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        return await self._send_request(endpoint, data)
    
    async def summarize_lesson(self, content: str) -> Dict[str, Any]:
        """教案摘要生成"""
        endpoint = "/v1/chat/completions"
        prompt = f"请为以下教案生成100字左右的摘要：\n{content}"
        
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "你是一位经验丰富的教师，擅长提炼教案的核心内容。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.5,
            "max_tokens": 200
        }
        
        return await self._send_request(endpoint, data)
    
    async def generate_question(self, knowledge_point: str, difficulty: str = "medium", count: int = 5) -> Dict[str, Any]:
        """根据知识点批量生成题目"""
        endpoint = "/v1/chat/completions"
        prompt = f"请根据以下知识点生成{count}道{difficulty}难度的题目，包含选项和答案：\n知识点：{knowledge_point}"
        
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "你是一位经验丰富的教师，擅长根据知识点生成高质量的题目。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1500
        }
        
        return await self._send_request(endpoint, data)
    
    async def analyze_question(self, question: str) -> Dict[str, Any]:
        """对题目生成解析"""
        endpoint = "/v1/chat/completions"
        prompt = f"请为以下题目生成详细的解析，包括考点、解题思路和易错点：\n{question}"
        
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "你是一位经验丰富的教师，擅长解析各种类型的题目。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        return await self._send_request(endpoint, data)
    
    async def generate_image(self, prompt: str, style: str = "插画") -> Dict[str, Any]:
        """根据描述生成插图"""
        endpoint = "/v1/images/generations"
        
        data = {
            "prompt": f"{prompt}，风格：{style}",
            "n": 1,
            "size": "1024x1024"
        }
        
        return await self._send_request(endpoint, data)
    
    async def generate_board(self, content: str) -> Dict[str, Any]:
        """生成板书风格图片"""
        endpoint = "/v1/images/generations"
        
        data = {
            "prompt": f"黑板粉笔手绘风格，结构清晰，内容：{content}",
            "n": 1,
            "size": "1024x1024"
        }
        
        return await self._send_request(endpoint, data)
    
    async def parse_document(self, file_url: str) -> Dict[str, Any]:
        """解析文档，将PDF/DOCX转换为JSON结构"""
        endpoint = "/v1/documents/parse"
        
        data = {
            "file_url": file_url,
            "output_format": "json"
        }
        
        return await self._send_request(endpoint, data)
    
    async def generate_ppt(self, lesson_content: str) -> Dict[str, Any]:
        """根据教案生成PPT"""
        endpoint = "/v1/ppt/generate"
        
        data = {
            "lesson_content": lesson_content,
            "template": "standard"
        }
        
        return await self._send_request(endpoint, data)
    
    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()


# 创建AI服务实例
ai_service = AIService()
