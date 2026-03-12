# VocabMaster API 接口文档

## 文档信息

| 属性 | 值 |
|------|-----|
| 版本 | v1.3.0 |
| 最后更新 | 2026-03-12 |
| 基础 URL | `http://localhost:3000/api` |

## 概述

VocabMaster 后端基于 Next.js 14 API Routes，所有接口以 `/api` 为前缀。

**认证方式**: 部分接口需要登录（通过 NextAuth.js Session），未登录返回 `401`。

**数据格式**: 请求和响应均为 JSON。

---

## 接口总览

| 模块 | 接口数 | 说明 |
|------|--------|------|
| [词库接口](#词库接口) | 4 | 词库列表、词库详情、当前词库 |
| [认证接口](#认证接口) | 7 | 注册、登录、忘记/重置密码、邮箱验证 |
| [学习进度接口](#学习进度接口) | 2 | 进度拉取与同步 |
| [每日统计接口](#每日统计接口) | 2 | 每日学习数据拉取与同步 |
| [学习会话接口](#学习会话接口) | 2 | 学习会话记录 |
| [用户管理接口](#用户管理接口) | 7 | 个人资料、密码、邮箱、设置、账户注销 |
| [收藏夹接口](#收藏夹接口) | 7 | 收藏夹 CRUD、单词收藏/取消 |
| [成就接口](#成就接口) | 2 | 成就进度查询与检查 |
| [统计接口](#统计接口) | 1 | 综合学习统计 |
| [例句/词源接口](#例句词源接口) | 2 | 单词例句、词根词源 |

---

## 词库接口

### 获取所有词库列表

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/words` |
| 认证 | 否 |
| 描述 | 获取所有词库列表（使用 5 分钟内存缓存） |

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

### 获取词库详情

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/words/:bookId` |
| 认证 | 否 |
| 描述 | 获取词库详情及单词列表，支持分页、搜索、排序、轻量模式 |

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码（从 1 开始） |
| `pageSize` | number | 50 | 每页条数（1-200） |
| `search` | string | - | 搜索关键词（模糊匹配单词或释义） |
| `all` | string | - | 设为 `"true"` 返回全部单词（不分页） |
| `ids` | string | - | 设为 `"true"` 只返回单词 ID 列表（轻量模式） |
| `order` | string | - | 排序方式：`freq-desc`（高频优先）/ `freq-asc`（低频优先）/ `alpha`（字母序）/ `random`（随机） |

**分页模式响应**:

```json
{
  "id": "clxxx...",
  "name": "CET-4",
  "description": "大学英语四级核心词汇",
  "wordCount": 4533,
  "words": [
    {
      "id": "clyyy...",
      "word": "abandon",
      "phonetic": "/əˈbændən/",
      "definition": "v. 放弃；抛弃",
      "partOfSpeech": "v.",
      "example": "He abandoned his plan.",
      "exampleTranslation": "他放弃了他的计划。",
      "difficulty": 2,
      "frequency": 8500
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

**轻量模式响应**（`?ids=true`）:

```json
{
  "id": "clxxx...",
  "name": "CET-4",
  "wordIds": ["clyyy...", "clzzz...", "..."]
}
```

---

### 获取当前词库

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/user/current-book` |
| 认证 | 是 |
| 描述 | 获取当前用户选择的词库 ID |

**响应示例**:

```json
{
  "currentBookId": "clxxx..."
}
```

---

### 更新当前词库

| 属性 | 值 |
|------|-----|
| 路径 | `PUT /api/user/current-book` |
| 认证 | 是 |
| 描述 | 更新当前用户选择的词库 |

**请求体**:

```json
{
  "bookId": "clxxx..."
}
```

**响应示例**:

```json
{
  "currentBookId": "clxxx..."
}
```

---

## 认证接口

### 用户注册

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/auth/register` |
| 认证 | 否 |
| 描述 | 邮箱密码注册 |

**请求体**:

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

| 属性 | 值 |
|------|-----|
| 路径 | `POST/GET /api/auth/[...nextauth]` |
| 认证 | 否 |
| 描述 | NextAuth.js 自动处理的认证端点 |

支持以下 Provider：

- **Credentials**: 邮箱 + 密码登录
- **GitHub**: GitHub OAuth（需配置 `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`）
- **Google**: Google OAuth（需配置 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`）

---

### 忘记密码

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/auth/forgot-password` |
| 认证 | 否 |
| 描述 | 发送密码重置邮件（无论邮箱是否存在都返回相同提示，防止枚举攻击） |

**请求体**:

```json
{
  "email": "user@example.com"
}
```

**响应示例**:

```json
{
  "message": "如果该邮箱已注册，您将收到密码重置邮件"
}
```

---

### 重置密码

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/auth/reset-password` |
| 认证 | 否 |
| 描述 | 使用邮件中的 token 重置密码 |

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | string | 是 | 邮件中的重置 token |
| `newPassword` | string | 是 | 新密码（至少 6 位） |

**响应示例**:

```json
{
  "message": "密码重置成功，请使用新密码登录"
}
```

---

### 邮箱验证（点击链接）

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/auth/verify-email` |
| 认证 | 否 |
| 描述 | 处理邮箱验证链接（注册验证或邮箱变更确认） |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | string | 是 | 验证 token |
| `type` | string | 否 | `"change-email"` 表示邮箱变更验证 |

**响应示例**:

```json
{
  "message": "邮箱验证成功",
  "type": "verify"
}
```

---

### 重新发送验证邮件

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/auth/verify-email` |
| 认证 | 是 |
| 描述 | 重新发送注册验证邮件 |

**响应示例**:

```json
{
  "message": "验证邮件已发送"
}
```

---

## 学习进度接口

### 拉取学习进度

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/progress` |
| 认证 | 是 |
| 描述 | 拉取云端全部学习进度，以 `wordId -> 进度对象` 的 Record 形式返回 |

**响应示例**:

```json
{
  "clyyy...": {
    "wordId": "clyyy...",
    "repetitions": 3,
    "easinessFactor": 2.36,
    "interval": 15,
    "nextReviewDate": "2026-03-20T00:00:00.000Z",
    "totalReviews": 5,
    "correctCount": 4,
    "status": "review",
    "updatedAt": "2026-03-05T10:00:00.000Z"
  }
}
```

---

### 同步学习进度

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/progress` |
| 认证 | 是 |
| 描述 | 推送本地学习进度到云端，按 `updatedAt` 做冲突检测（客户端时间 >= 服务端时间才写入） |

**请求体**:

```json
{
  "wordProgress": {
    "clyyy...": {
      "wordId": "clyyy...",
      "repetitions": 3,
      "easinessFactor": 2.36,
      "interval": 15,
      "nextReviewDate": "2026-03-20T00:00:00.000Z",
      "totalReviews": 5,
      "correctCount": 4,
      "status": "review",
      "updatedAt": "2026-03-05T10:00:00.000Z"
    }
  }
}
```

**响应示例**:

```json
{
  "message": "成功同步 15 条学习记录",
  "synced": 15,
  "skipped": 2
}
```

---

## 每日统计接口

### 拉取每日统计

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/daily-stats` |
| 认证 | 是 |
| 描述 | 拉取云端每日统计数据（最多约一年） |

**响应示例**:

```json
{
  "2026-03-10": {
    "date": "2026-03-10",
    "wordsLearned": 20,
    "wordsReviewed": 50,
    "studyMinutes": 35
  },
  "2026-03-11": {
    "date": "2026-03-11",
    "wordsLearned": 15,
    "wordsReviewed": 30,
    "studyMinutes": 20
  }
}
```

---

### 同步每日统计

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/daily-stats` |
| 认证 | 是 |
| 描述 | 推送本地每日统计到云端（按日期合并，取两者较大值） |

**请求体**:

```json
{
  "dailyStats": {
    "2026-03-10": {
      "wordsLearned": 20,
      "wordsReviewed": 50,
      "studyMinutes": 35
    }
  }
}
```

**响应示例**:

```json
{
  "message": "成功同步 5 天的统计数据",
  "synced": 5
}
```

---

## 学习会话接口

### 获取学习会话

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/sessions` |
| 认证 | 是 |
| 描述 | 获取用户最近 100 条学习会话记录 |

**响应示例**:

```json
[
  {
    "id": "clxxx...",
    "mode": "learn",
    "bookId": "clyyy...",
    "startTime": "2026-03-10T14:00:00.000Z",
    "endTime": "2026-03-10T14:25:00.000Z",
    "newWordsCount": 20,
    "reviewWordsCount": 0,
    "correctCount": 18,
    "totalCount": 20
  }
]
```

---

### 创建学习会话

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/sessions` |
| 认证 | 是 |
| 描述 | 创建一条学习会话记录 |

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `mode` | string | 是 | 学习模式：`learn` / `review` / `spell` / `quiz` |
| `startTime` | string | 是 | 开始时间（ISO 8601） |
| `endTime` | string | 是 | 结束时间（ISO 8601） |
| `bookId` | string | 否 | 词库 ID |
| `newWordsCount` | number | 否 | 新学单词数 |
| `reviewWordsCount` | number | 否 | 复习单词数 |
| `correctCount` | number | 否 | 正确数 |
| `totalCount` | number | 否 | 总数 |

---

## 用户管理接口

### 获取个人资料

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/user/profile` |
| 认证 | 是 |
| 描述 | 获取当前用户个人资料 |

**响应示例**:

```json
{
  "id": "clxxx...",
  "name": "Jem",
  "email": "user@example.com",
  "image": null,
  "emailVerified": "2026-03-01T00:00:00.000Z",
  "createdAt": "2026-02-15T00:00:00.000Z"
}
```

---

### 更新个人资料

| 属性 | 值 |
|------|-----|
| 路径 | `PUT /api/user/profile` |
| 认证 | 是 |
| 描述 | 更新昵称（≤50 字符） |

**请求体**:

```json
{
  "name": "新昵称"
}
```

---

### 修改密码

| 属性 | 值 |
|------|-----|
| 路径 | `PUT /api/user/password` |
| 认证 | 是 |
| 描述 | 登录状态下修改密码（需验证当前密码） |

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `currentPassword` | string | 是 | 当前密码 |
| `newPassword` | string | 是 | 新密码（至少 6 位） |

**响应示例**:

```json
{
  "message": "密码修改成功"
}
```

---

### 获取用户设置

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/user/settings` |
| 认证 | 是 |
| 描述 | 获取用户学习设置，无记录时返回默认值 |

**响应示例**:

```json
{
  "dailyNewWords": 20,
  "dailyReviewWords": 50,
  "autoPlayAudio": true,
  "showPhonetic": true,
  "pronunciation": "en-US",
  "theme": "system",
  "wordOrder": "freq-desc"
}
```

---

### 更新用户设置

| 属性 | 值 |
|------|-----|
| 路径 | `PUT /api/user/settings` |
| 认证 | 是 |
| 描述 | 更新用户学习设置（支持部分更新） |

**请求体（均为可选）**:

| 字段 | 类型 | 范围 | 说明 |
|------|------|------|------|
| `dailyNewWords` | number | 5–100 | 每日新词数量 |
| `dailyReviewWords` | number | 10–200 | 每日复习数量 |
| `autoPlayAudio` | boolean | - | 自动播放发音 |
| `showPhonetic` | boolean | - | 显示音标 |
| `pronunciation` | string | `en-US` / `en-GB` | 发音类型 |
| `theme` | string | `light` / `dark` / `system` | 主题 |
| `wordOrder` | string | `freq-desc` / `freq-asc` / `alpha` / `random` | 学习顺序 |

---

### 变更邮箱

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/user/change-email` |
| 认证 | 是 |
| 描述 | 发起邮箱变更，向新邮箱发送验证邮件（需验证当前密码） |

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `password` | string | 是 | 当前密码 |
| `newEmail` | string | 是 | 新邮箱地址 |

**响应示例**:

```json
{
  "message": "验证邮件已发送到新邮箱，请查收"
}
```

---

### 注销账户

| 属性 | 值 |
|------|-----|
| 路径 | `DELETE /api/user/account` |
| 认证 | 是 |
| 描述 | 注销账户（需密码确认，级联删除所有关联数据） |

**请求体**:

```json
{
  "password": "当前密码"
}
```

**响应示例**:

```json
{
  "message": "账户已注销"
}
```

---

## 收藏夹接口

### 获取收藏夹列表

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/folders` |
| 认证 | 是 |
| 描述 | 获取用户所有收藏夹（含单词数量） |

**响应示例**:

```json
[
  {
    "id": "clxxx...",
    "name": "生词本",
    "color": "#3b82f6",
    "sortOrder": 0,
    "wordCount": 42,
    "createdAt": "2026-03-01T00:00:00.000Z"
  }
]
```

---

### 创建收藏夹

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/folders` |
| 认证 | 是 |
| 描述 | 创建新收藏夹 |

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 收藏夹名称（1–20 字符） |
| `color` | string | 否 | 颜色（默认 `#3b82f6`） |

---

### 获取收藏夹详情

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/folders/:folderId` |
| 认证 | 是 |
| 描述 | 获取收藏夹详情及单词列表 |

**响应示例**:

```json
{
  "id": "clxxx...",
  "name": "生词本",
  "color": "#3b82f6",
  "words": [
    {
      "id": "clyyy...",
      "word": "abandon",
      "phonetic": "/əˈbændən/",
      "definition": "v. 放弃；抛弃",
      "addedAt": "2026-03-10T00:00:00.000Z"
    }
  ]
}
```

---

### 更新收藏夹

| 属性 | 值 |
|------|-----|
| 路径 | `PUT /api/folders/:folderId` |
| 认证 | 是 |
| 描述 | 更新收藏夹名称或颜色 |

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 名称（1–20 字符） |
| `color` | string | 否 | 颜色 |

---

### 删除收藏夹

| 属性 | 值 |
|------|-----|
| 路径 | `DELETE /api/folders/:folderId` |
| 认证 | 是 |
| 描述 | 删除收藏夹 |

**响应示例**:

```json
{
  "success": true
}
```

---

### 添加单词到收藏夹

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/folders/:folderId/words` |
| 认证 | 是 |
| 描述 | 添加单词到收藏夹（重复添加不报错） |

**请求体**:

```json
{
  "wordId": "clyyy..."
}
```

**响应示例**:

```json
{
  "id": "clzzz...",
  "folderId": "clxxx...",
  "wordId": "clyyy...",
  "addedAt": "2026-03-10T00:00:00.000Z"
}
```

---

### 从收藏夹移除单词

| 属性 | 值 |
|------|-----|
| 路径 | `DELETE /api/folders/:folderId/words` |
| 认证 | 是 |
| 描述 | 从收藏夹移除单词 |

**请求体**:

```json
{
  "wordId": "clyyy..."
}
```

**响应示例**:

```json
{
  "success": true
}
```

---

## 成就接口

### 获取成就进度

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/achievements` |
| 认证 | 是 |
| 描述 | 获取当前用户所有成就进度（7 级段位体系） |

---

### 检查并更新成就

| 属性 | 值 |
|------|-----|
| 路径 | `POST /api/achievements` |
| 认证 | 是 |
| 描述 | 触发成就检查、更新数据库、返回新解锁的成就 |

**响应示例**:

```json
{
  "achievements": [
    {
      "code": "word_learner",
      "name": "词汇学徒",
      "tier": "bronze",
      "progress": 75
    }
  ],
  "newUnlocks": [
    {
      "code": "streak_master",
      "name": "坚持达人",
      "tier": "silver",
      "progress": 100
    }
  ]
}
```

---

## 统计接口

### 获取学习统计

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/stats` |
| 认证 | 是 |
| 描述 | 获取综合学习统计（进度分布、正确率、打卡记录、连续天数） |

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

## 例句/词源接口

### 获取单词例句

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/words/examples` |
| 认证 | 否 |
| 描述 | 获取单词例句（含中文翻译），优先从缓存读取，未命中时调用外部 API |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `word` | string | 是 | 要查询的英文单词 |

**响应示例**:

```json
{
  "word": "abandon",
  "examples": [
    {
      "sentence": "The crew abandoned the sinking ship.",
      "translation": "船员们弃船而逃。"
    },
    {
      "sentence": "She abandoned her career to raise her children.",
      "translation": "她放弃了事业来抚养孩子。"
    }
  ]
}
```

---

### 获取单词词源

| 属性 | 值 |
|------|-----|
| 路径 | `GET /api/words/etymology` |
| 认证 | 否 |
| 描述 | 获取单词词根词缀和词源信息，优先从缓存读取 |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `word` | string | 是 | 要查询的英文单词 |

**响应示例**:

```json
{
  "word": "abandon",
  "origin": "源自古法语 abandoner，由 a-（表示方向）+ bandon（权力、控制）组成",
  "roots": [
    { "part": "a-", "meaning": "向、到" },
    { "part": "bandon", "meaning": "权力、控制（日耳曼语源）" }
  ],
  "relatedWords": ["abandonment", "abandoned"]
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
| `403` | 禁止访问 |
| `404` | 资源不存在 |
| `409` | 资源冲突（如邮箱已注册） |
| `429` | 请求过于频繁（登录限流） |
| `500` | 服务器内部错误 |
