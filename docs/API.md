# VocabMaster API 接口文档

## 概述

VocabMaster 后端基于 Next.js 14 API Routes，所有接口以 `/api` 为前缀。

**基础 URL**: `http://localhost:3000/api`

**认证方式**: 部分接口需要登录（通过 NextAuth.js Session），未登录返回 `401`。

**数据格式**: 请求和响应均为 JSON。

---

## 词库接口

### 获取所有词库列表

```
GET /api/words
```

**认证**: 不需要

**响应示例**:

```json
[
  {
    "id": "clxxx...",
    "name": "CET-4",
    "description": "大学英语四级核心词汇",
    "level": "beginner",
    "category": "exam",
    "wordCount": 4533,
    "coverColor": "#2563eb",
    "sortOrder": 1
  }
]
```

---

### 获取词库详情（分页）

```
GET /api/words/:bookId
```

**认证**: 不需要

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码（从 1 开始） |
| `pageSize` | number | 50 | 每页条数（1-200） |
| `search` | string | - | 搜索关键词（模糊匹配单词或释义） |
| `all` | string | - | 设为 `"true"` 返回全部单词（不分页） |

**分页模式响应**:

```json
{
  "id": "clxxx...",
  "name": "CET-4",
  "description": "大学英语四级核心词汇",
  "level": "beginner",
  "category": "exam",
  "wordCount": 4533,
  "coverColor": "#2563eb",
  "sortOrder": 1,
  "words": [
    {
      "id": "clyyy...",
      "bookId": "clxxx...",
      "word": "abandon",
      "phonetic": "/əˈbændən/",
      "definition": "v. 放弃；抛弃",
      "partOfSpeech": "v.",
      "example": "He abandoned his plan.",
      "exampleTranslation": "他放弃了他的计划。",
      "difficulty": 2
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 4533,
    "totalPages": 91
  }
}
```

**全量模式响应**（`?all=true`）:

```json
{
  "id": "clxxx...",
  "name": "CET-4",
  "words": [...]
}
```

> **注意**: 全量模式用于学习模式，返回数据量较大，浏览页面请使用分页模式。

---

## 认证接口

### 用户注册

```
POST /api/auth/register
```

**认证**: 不需要

**请求体**:

```json
{
  "name": "张三",
  "email": "user@example.com",
  "password": "<你的密码>"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 昵称（为空则从邮箱提取） |
| `email` | string | 是 | 邮箱地址 |
| `password` | string | 是 | 密码（至少 6 位） |

**成功响应** (`201`):

```json
{
  "id": "clxxx...",
  "name": "张三",
  "email": "user@example.com",
  "message": "注册成功"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| `400` | 参数验证失败（邮箱格式错误、密码太短等） |
| `409` | 邮箱已被注册 |
| `500` | 服务器错误 |

---

### NextAuth 认证

```
POST /api/auth/[...nextauth]
GET  /api/auth/[...nextauth]
```

由 NextAuth.js 自动处理，支持以下 Provider：

- **Credentials**: 邮箱 + 密码登录
- **GitHub**: GitHub OAuth（需配置 `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`）
- **Google**: Google OAuth（需配置 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`）

---

## 学习进度接口

### 获取学习进度

```
GET /api/progress
```

**认证**: 需要

**响应示例**:

```json
[
  {
    "id": "clxxx...",
    "userId": "cluuu...",
    "wordId": "clyyy...",
    "repetitions": 3,
    "easinessFactor": 2.36,
    "interval": 15,
    "nextReviewDate": "2026-03-20T00:00:00.000Z",
    "totalReviews": 5,
    "correctCount": 4,
    "status": "review",
    "word": {
      "id": "clyyy...",
      "word": "abandon",
      "definition": "v. 放弃；抛弃"
    }
  }
]
```

---

### 同步学习进度

```
POST /api/progress
```

**认证**: 需要

**请求体**:

```json
{
  "wordProgress": {
    "wordId_1": {
      "wordId": "clyyy...",
      "repetitions": 3,
      "easinessFactor": 2.36,
      "interval": 15,
      "nextReviewDate": "2026-03-20T00:00:00.000Z",
      "totalReviews": 5,
      "correctCount": 4,
      "status": "review"
    }
  }
}
```

**成功响应**:

```json
{
  "message": "成功同步 15 条学习记录",
  "synced": 15
}
```

---

## 统计接口

### 获取学习统计

```
GET /api/stats
```

**认证**: 需要

**响应示例**:

```json
{
  "progressStats": [
    { "status": "learning", "_count": { "status": 45 } },
    { "status": "review", "_count": { "status": 120 } },
    { "status": "mastered", "_count": { "status": 30 } }
  ],
  "accuracy": {
    "totalReviews": 500,
    "correctCount": 380
  },
  "checkIns": [
    {
      "id": "clxxx...",
      "checkInDate": "2026-03-05T00:00:00.000Z",
      "wordsLearned": 30,
      "wordsReviewed": 50,
      "studyMinutes": 25,
      "streak": 7
    }
  ],
  "streak": 7
}
```

---

## 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "error": "错误描述信息"
}
```

**常见状态码**:

| 状态码 | 说明 |
|--------|------|
| `400` | 请求参数错误 |
| `401` | 未登录 |
| `404` | 资源不存在 |
| `409` | 资源冲突 |
| `500` | 服务器内部错误 |
