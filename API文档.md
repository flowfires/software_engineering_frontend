# AI辅助教师备课系统 - API 文档

**版本**: 1.0.0  
**Base URL**: `/api/v1`

---

## 📋 目录

- [认证模块 (Auth)](#认证模块-auth)
- [教案模块 (Lesson)](#教案模块-lesson)
- [AI 智能服务模块 (AI)](#ai-智能服务模块-ai)
- [学习档案模块 (Learning Profile)](#学习档案模块-learning-profile)
- [媒体生成模块 (Media)](#媒体生成模块-media)
- [数据模型 (Schemas)](#数据模型-schemas)

---

## 认证模块 (Auth)

### 1. 用户注册
- **端点**: `POST /api/v1/auth/register`
- **描述**: 教师注册
- **请求体**: `UserCreate`
  ```json
  {
    "username": "string (3-50字符)",
    "email": "string (email格式)",
    "password": "string (6-50字符)",
    "full_name": "string (可选, 最多100字符)"
  }
  ```
- **响应**: `201 Created` - `UserResponse`
- **认证**: 无需认证

---

### 2. 用户登录
- **端点**: `POST /api/v1/auth/login`
- **描述**: 登录，返回JWT Token
- **请求体**: `application/x-www-form-urlencoded`
  ```
  username=xxx&password=xxx
  ```
- **响应**: `200 OK`
  ```json
  {
    "access_token": "string",
    "token_type": "bearer"
  }
  ```
- **认证**: 无需认证

---

### 3. 退出登录
- **端点**: `POST /api/v1/auth/logout`
- **描述**: 退出登录
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

### 4. 刷新Token
- **端点**: `POST /api/v1/auth/refresh`
- **描述**: 刷新Token
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

### 5. 获取用户资料
- **端点**: `GET /api/v1/auth/profile`
- **描述**: 获取当前用户完整信息
- **响应**: `200 OK` - `UserProfileResponse`
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "string",
    "full_name": "string",
    "role": "string",
    "avatar_url": "string",
    "phone": "string",
    "subject": "string",
    "teaching_style": ["string"],
    "personal_desc": "string",
    "years_of_experience": 0,
    "school": "string",
    "title": "string",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
  ```
- **认证**: 需要 Bearer Token

---

### 6. 更新用户资料
- **端点**: `PUT /api/v1/auth/profile`
- **描述**: 更新用户信息
- **请求体**: `UserProfileUpdate`
  ```json
  {
    "full_name": "string (可选)",
    "phone": "string (可选)",
    "subject": "string (可选)",
    "teaching_style": ["string"] (可选),
    "personal_desc": "string (可选)",
    "years_of_experience": 0 (可选, 0-50),
    "school": "string (可选)",
    "title": "string (可选)"
  }
  ```
- **响应**: `200 OK` - `UserProfileResponse`
- **认证**: 需要 Bearer Token

---

### 7. 修改密码
- **端点**: `PUT /api/v1/auth/password`
- **描述**: 修改密码
- **请求体**: `PasswordUpdate`
  ```json
  {
    "old_password": "string (最少6字符)",
    "new_password": "string (6-50字符)"
  }
  ```
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

### 8. 上传头像
- **端点**: `POST /api/v1/auth/avatar`
- **描述**: 上传头像到阿里云 OSS
- **请求体**: `multipart/form-data`
  ```
  file: <binary>
  ```
- **响应**: `200 OK` - `AvatarResponse`
  ```json
  {
    "avatar_url": "string",
    "message": "头像上传成功"
  }
  ```
- **认证**: 需要 Bearer Token

---

## 教案模块 (Lesson)

### 1. 获取教案列表
- **端点**: `GET /api/v1/lesson/list`
- **描述**: 获取教师的所有教案列表，支持分页和筛选
- **查询参数**:
  - `page`: integer (默认: 1, 最小: 1)
  - `page_size`: integer (默认: 20, 范围: 1-100)
  - `subject`: string (可选)
  - `grade`: string (可选)
- **响应**: `200 OK` - 教案列表
- **认证**: 需要 Bearer Token

---

### 2. 创建教案
- **端点**: `POST /api/v1/lesson`
- **描述**: 新建教案（可创建空白教案或带初始内容的教案）
- **请求体**: `LessonCreateIn`
  ```json
  {
    "template_id": "string (默认: default-v1)",
    "subject": "string (可选)",
    "grade": "string (可选)",
    "lesson_title": "string (必需)",
    "lesson_type": "string (可选)",
    "class_duration": 45 (可选),
    "lesson_count": 1 (可选),
    "content": {} (可选, object类型),
    "notes": "string (可选)"
  }
  ```
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

### 3. 获取教案详情
- **端点**: `GET /api/v1/lesson/{id}`
- **描述**: 获取教案详情
- **路径参数**:
  - `id`: integer (必需)
- **响应**: `200 OK` - 教案详情
- **认证**: 需要 Bearer Token

---

### 4. 更新教案（完整更新）
- **端点**: `PUT /api/v1/lesson/{id}`
- **描述**: 编辑教案（整体更新）
- **路径参数**:
  - `id`: integer (必需)
- **请求体**: `LessonUpdateIn`
  ```json
  {
    "subject": "string (可选)",
    "grade": "string (可选)",
    "lesson_title": "string (可选)",
    "lesson_type": "string (可选)",
    "class_duration": 45 (可选),
    "lesson_count": 1 (可选),
    "content": {} (可选, object类型),
    "locked_sections": ["string"] (可选),
    "notes": "string (可选)"
  }
  ```
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

### 5. 更新教案（局部更新）
- **端点**: `PATCH /api/v1/lesson/{id}`
- **描述**: 局部更新教案
- **路径参数**:
  - `id`: integer (必需)
- **请求体**: `LessonPatchIn`（同 LessonUpdateIn）
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

### 6. 删除教案
- **端点**: `DELETE /api/v1/lesson/{id}`
- **描述**: 删除教案
- **路径参数**:
  - `id`: integer (必需)
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

### 7. 更新教案单个章节
- **端点**: `PATCH /api/v1/lesson/{id}/section`
- **描述**: 更新教案的单个章节内容，支持嵌套 key（如 teaching_flow.main）
- **路径参数**:
  - `id`: integer (必需)
- **请求体**: `LessonSectionUpdateIn`
  ```json
  {
    "section_key": "string (必需, 如: objectives 或 teaching_flow.main)",
    "content": "any (必需)",
    "lock": true (可选)
  }
  ```
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

## AI 智能服务模块 (AI)

### 教案相关

#### 1. 教案澄清对话
- **端点**: `POST /api/v1/ai/lesson/clarify/chat`
- **描述**: 多轮对话收集教案生成所需信息
- **请求体**: `LessonClarifyChatIn`
  ```json
  {
    "session_id": "string (必需)",
    "message": "string (必需)"
  }
  ```
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

#### 2. 直接更新澄清数据
- **端点**: `POST /api/v1/ai/lesson/clarify/update`
- **描述**: 用于前端表单直接提交场景
- **请求体**: `LessonClarifyUpdateIn`
  ```json
  {
    "session_id": "string (必需)",
    "clarify_data": {} (必需, 要更新的澄清数据)
  }
  ```
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

#### 3. 确认澄清完成
- **端点**: `POST /api/v1/ai/lesson/clarify/confirm`
- **描述**: 将会话状态标记为可生成
- **查询参数**:
  - `session_id`: string (必需)
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

#### 4. 获取澄清会话状态
- **端点**: `GET /api/v1/ai/lesson/clarify/state`
- **描述**: 获取澄清会话状态
- **查询参数**:
  - `session_id`: string (必需)
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

#### 5. 重置澄清会话
- **端点**: `DELETE /api/v1/ai/lesson/clarify/session`
- **描述**: 重置澄清会话
- **查询参数**:
  - `session_id`: string (必需)
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

#### 6. 触发教案生成
- **端点**: `POST /api/v1/ai/lesson/generate`
- **描述**: 触发教案异步生成，返回 task_id，前端通过轮询 `/lesson/generate/status` 查看进度
- **请求体**: `LessonGenerateIn`
  ```json
  {
    "session_id": "string (可选, 从会话获取 clarify)",
    "clarify": {} (可选, LessonClarifySchema, 直接提供的澄清数据),
    "template_id": "string (可选, 默认使用标准模板)",
    "locked_sections": ["string"] (可选, 锁定的章节 key 列表)
  }
  ```
- **响应**: `200 OK` - 返回 task_id
- **认证**: 需要 Bearer Token

---

#### 7. 查询教案生成状态
- **端点**: `GET /api/v1/ai/lesson/generate/status`
- **描述**: 查询教案生成任务状态，返回当前进度和已生成的内容
- **查询参数**:
  - `task_id`: string (必需)
- **响应**: `200 OK` - 包含进度和部分生成内容
- **认证**: 需要 Bearer Token

---

#### 8. 获取教案模板列表
- **端点**: `GET /api/v1/ai/lesson/templates`
- **描述**: 获取可用的教案模板列表
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

### 习题相关

#### 9. 习题澄清对话
- **端点**: `POST /api/v1/ai/exercise/clarify/chat`
- **请求体**: `ClarifyChatIn`
  ```json
  {
    "session_id": "string",
    "message": "string"
  }
  ```
- **响应**: `200 OK`

---

#### 10. 习题澄清确认
- **端点**: `POST /api/v1/ai/exercise/clarify/confirm`
- **请求体**: `ClarifyConfirmIn`
  ```json
  {
    "session_id": "string",
    "confirm_md_final": "string"
  }
  ```
- **响应**: `200 OK`

---

#### 11. 习题生成
- **端点**: `POST /api/v1/ai/exercise/generate`
- **请求体**: `GenerateIn`
  ```json
  {
    "session_id": "string"
  }
  ```
- **响应**: `200 OK`

---

### 学情分析

#### 12. LPS 分析 (GET)
- **端点**: `GET /api/v1/ai/lps/analyze`
- **查询参数**:
  - `msg`: string (必需)
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

#### 13. LPS 分析 (POST)
- **端点**: `POST /api/v1/ai/lps/test`
- **查询参数**:
  - `msg`: string (必需)
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

## 学习档案模块 (Learning Profile)

### 1. 获取所有学习档案
- **端点**: `GET /api/v1/learning_profile/`
- **描述**: 获取当前用户的所有学习档案
- **响应**: `200 OK` - `LearningProfileOut[]`
- **认证**: 需要 Bearer Token

---

### 2. 创建学习档案
- **端点**: `POST /api/v1/learning_profile/`
- **描述**: 创建学习档案
- **请求体**: `LearningProfileCreate`
  ```json
  {
    "title": "string (必需)",
    "profile": {
      "scope": {
        "subject": "string (必需)",
        "grade": "string (必需)",
        "class_name": "string (可选)",
        "semester": "string (可选)",
        "related_chapter": "string (可选)",
        "data_time_range": "string (可选)"
      },
      "overall_learning_level": {
        "overall_level": "string (必需)",
        "strong_ratio": "string (可选)",
        "average_ratio": "string (可选)",
        "weak_ratio": "string (可选)"
      },
      "prior_knowledge": {
        "mastered_knowledge_points": ["string"],
        "partially_mastered_knowledge_points": ["string"]
      },
      "common_mistakes": [
        {
          "knowledge_point": "string",
          "description": "string",
          "frequency": "string"
        }
      ],
      "learning_behavior": {
        "calculation_skill": "string (可选)",
        "conceptual_understanding": "string (可选)",
        "class_participation": "string (可选)",
        "homework_completion": "string (可选)"
      },
      "teaching_suggestions": ["string"],
      "remarks": "string (可选)",
      "created_by": "teacher | system | ai (默认: teacher)"
    }
  }
  ```
- **响应**: `201 Created` - `LearningProfileOut`
- **认证**: 需要 Bearer Token

---

### 3. 获取学习档案详情
- **端点**: `GET /api/v1/learning_profile/{profile_id}`
- **描述**: 根据ID获取学习档案
- **路径参数**:
  - `profile_id`: integer (必需)
- **响应**: `200 OK` - `LearningProfileOut`
- **认证**: 需要 Bearer Token

---

### 4. 更新学习档案
- **端点**: `PUT /api/v1/learning_profile/{profile_id}`
- **描述**: 更新学习档案
- **路径参数**:
  - `profile_id`: integer (必需)
- **请求体**: `LearningProfileCreate`
- **响应**: `200 OK` - `LearningProfileOut`
- **认证**: 需要 Bearer Token

---

### 5. 删除学习档案
- **端点**: `DELETE /api/v1/learning_profile/{profile_id}`
- **描述**: 删除学习档案
- **路径参数**:
  - `profile_id`: integer (必需)
- **响应**: `200 OK`
- **认证**: 需要 Bearer Token

---

## 媒体生成模块 (Media)

### 1. 生成图像
- **端点**: `POST /api/v1/media/image/generate`
- **描述**: 生成图像（同步）。流程：用户输入 → LLM 优化提示词（可选）→ 调用智谱 API → 返回图像 URL
- **请求体**: `ImageGenerateRequest`
  ```json
  {
    "prompt": "string (必需, 1-1000字符)",
    "size": "string (默认: 1024x1024)",
    "quality": "standard | hd (默认: standard)",
    "optimize_prompt": true (默认: true, 是否使用 LLM 优化提示词),
    "watermark_enabled": false (默认: false, 是否添加水印)
  }
  ```
- **响应**: `200 OK` - `ImageGenerateResponse`
  ```json
  {
    "original_prompt": "string",
    "optimized_prompt": "string",
    "image_url": "string",
    "created": 1234567890
  }
  ```
- **认证**: 需要 Bearer Token

---

### 2. 发起视频生成任务
- **端点**: `POST /api/v1/media/video/generate`
- **描述**: 发起视频生成任务（异步）。流程：用户输入 → LLM 优化提示词（可选）→ 提交生成任务 → 返回任务 ID。通过 `/video/status/{task_id}` 查询生成进度
- **请求体**: `VideoGenerateRequest`
  ```json
  {
    "prompt": "string (必需, 1-500字符)",
    "size": "string (默认: 1024x1024)",
    "fps": 30 (默认: 30, 范围: 15-60),
    "quality": "speed | quality (默认: speed)",
    "with_audio": true (默认: true),
    "optimize_prompt": true (默认: true),
    "watermark_enabled": false (默认: false)
  }
  ```
- **响应**: `200 OK` - `VideoGenerateResponse`
  ```json
  {
    "task_id": "string",
    "original_prompt": "string",
    "optimized_prompt": "string",
    "task_status": "string",
    "message": "视频生成任务已提交，请通过任务 ID 查询进度"
  }
  ```
- **认证**: 需要 Bearer Token

---

### 3. 查询视频生成状态
- **端点**: `GET /api/v1/media/video/status/{task_id}`
- **描述**: 查询视频生成任务状态，返回任务状态，成功时包含视频 URL 和封面图 URL
- **路径参数**:
  - `task_id`: string (必需)
- **响应**: `200 OK` - `VideoStatusResponse`
  ```json
  {
    "task_id": "string",
    "task_status": "PROCESSING | SUCCESS | FAIL",
    "video_url": "string (成功时返回)",
    "cover_image_url": "string (成功时返回)",
    "error": "string (失败时返回)"
  }
  ```
- **认证**: 需要 Bearer Token

---

## 数据模型 (Schemas)

### 教案澄清数据 (LessonClarifySchema)
```json
{
  "subject": "string (可选, 学科)",
  "grade": "string (可选, 年级)",
  "lesson_title": "string (可选, 课题名称)",
  "lesson_type": "string (可选, 课程类型: 新授/复习/实验/综合)",
  "class_duration": 45 (可选, 单课时长度-分钟),
  "lesson_count": 1 (可选, 课时数),
  "teaching_goal_focus": "string (可选, 教学侧重点: 知识/能力/素养/应试)",
  "difficulty_level": "string (可选, 难度水平: 基础/中等/提高)",
  "exam_related": false (可选, 是否与考试相关),
  "curriculum_standard": "string (可选, 对应课程标准)",
  "constraints": "string (可选, 特殊约束条件)",
  "notes": "string (可选, 教师补充说明)"
}
```

---

## 其他端点

### 健康检查
- **端点**: `GET /status/ping`
- **描述**: 服务健康检查
- **响应**: `200 OK`
- **认证**: 无需认证

---

## 认证方式

所有需要认证的端点使用 **OAuth2 Bearer Token** 方式：

```
Authorization: Bearer <access_token>
```

Token 通过 `POST /api/v1/auth/login` 获取。

---

## 错误响应

所有端点在参数验证失败时返回：

**422 Unprocessable Entity**
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "错误信息",
      "type": "error_type"
    }
  ]
}
```

---

## 注意事项

1. **教案内容字段 (`content`)** 是 **object 类型**，不是字符串
2. **登录接口** 使用 `application/x-www-form-urlencoded` 格式，不是 JSON
3. **分页参数**: `page` 从 1 开始，`page_size` 最大为 100
4. **异步任务**: 教案生成、视频生成都是异步的，需要轮询状态接口
5. **所有日期时间** 使用 ISO 8601 格式：`YYYY-MM-DDTHH:mm:ss`
 
---

**文档生成时间**: 2026年1月4日
