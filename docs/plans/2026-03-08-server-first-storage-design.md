# 设计文档：登录用户数据全面服务器化

## 背景

当前架构采用"本地优先 + 云端同步"模式，所有数据先写入 localStorage（Zustand persist），
登录用户再异步同步到服务器。这导致多设备间数据不一致。

## 目标

登录用户的所有数据以服务器为唯一真实来源（server-first），消除多设备数据差异。
未登录用户保持现有本地存储模式不变。

## 数据范围

| 数据类型 | 当前存储 | 目标存储（登录用户） | DB 模型 |
|---------|---------|-------------------|---------|
| 单词学习进度 | 本地 + 同步 | 仅服务器 | UserWordProgress（已有） |
| 每日统计 | 本地 + 同步 | 仅服务器 | DailyCheckIn（已有） |
| 当前选择词库 | 仅本地 | 服务器 | User.currentBookId（新增字段） |
| 用户设置 | 仅本地 | 服务器 | UserSettings（新增模型） |
| 学习会话 | 仅本地 | 服务器 | LearningSession（已有模型） |
| 成就进度 | 本地 + API | 仅服务器 | UserAchievement（已有） |

## 架构设计

### 1. 数据库变更

**User 模型新增字段：**
```
currentBookId  String?  // 当前选择的词库 ID
```

**新增 UserSettings 模型：**
```
model UserSettings {
  id               String @id @default(cuid())
  userId           String @unique
  dailyNewWords    Int    @default(20)
  dailyReviewWords Int    @default(50)
  autoPlayAudio    Boolean @default(true)
  showPhonetic     Boolean @default(true)
  pronunciation    String  @default("en-US")
  theme            String  @default("system")
  user             User   @relation(...)
}
```

### 2. 新增/修改 API 路由

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/user/settings` | GET/PUT | 获取/更新用户设置 |
| `/api/user/current-book` | GET/PUT | 获取/更新当前词库 |
| `/api/sessions` | POST | 创建学习会话 |
| `/api/progress` | GET/POST | 已有，保持不变 |
| `/api/daily-stats` | GET/POST | 已有，保持不变 |
| `/api/achievements` | GET/POST | 已有，保持不变 |

### 3. 前端 Store 重构

**核心思路：** 创建统一的数据访问层，根据登录状态自动路由到本地 store 或服务器 API。

**新增 `useServerData` hook：**
- 登录用户专用
- 使用 SWR 缓存服务器数据，提供即时 UI 响应
- 写操作：先乐观更新本地 SWR 缓存，再异步写服务器
- 读操作：从 SWR 缓存读取（首次从服务器加载）

**新增 `useLearningData` 统一 hook：**
- 根据 session 状态自动选择数据源
- 登录用户 → useServerData（服务器）
- 未登录用户 → useLearningStore（本地）
- 对外暴露统一接口，组件无需关心数据来源

### 4. 登录迁移流程

用户首次登录时：
1. 检测本地 localStorage 是否有学习数据
2. 如有，将本地数据推送到服务器（使用现有 sync 逻辑）
3. 推送完成后清除本地学习数据（保留 settings 迁移到服务器）
4. 后续所有操作直接读写服务器

### 5. 移除 sync 模块

登录用户不再需要双向同步：
- 删除 `SyncProvider` 组件
- 删除 `src/lib/sync.ts` 中的同步逻辑
- `updateWordProgress` 等写操作直接调用 API

## 实施阶段

### Phase 1: 数据库 + API（后端）
1. Schema 变更：User.currentBookId, UserSettings 模型
2. 新增 API：/api/user/settings, /api/user/current-book, /api/sessions
3. 测试 API

### Phase 2: Server Data Hook（前端基础设施）
4. 创建 `useServerData` hook（SWR + API 调用）
5. 创建 `useLearningData` 统一 hook
6. 测试 hooks

### Phase 3: 页面迁移（前端）
7. 迁移首页 page.tsx
8. 迁移学习页面（learn/new, learn/review, learn/spell, learn/quiz）
9. 迁移词库页面（wordbooks, wordbooks/[bookId]）
10. 迁移统计页面 stats
11. 迁移个人中心 profile
12. 迁移卡片组件（flash-card, quiz-card, spell-card）

### Phase 4: 清理 + 迁移
13. 实现登录迁移流程
14. 移除 SyncProvider 和 sync.ts
15. 清理 store.ts（移除登录用户不需要的逻辑）

### Phase 5: 验证 + 部署
16. 全量测试
17. 构建验证
18. 部署
