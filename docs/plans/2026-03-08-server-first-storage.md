# 登录用户数据全面服务器化 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 登录用户的所有学习数据以服务器为唯一真实来源，消除多设备数据差异。

**Architecture:** 新增 UserSettings 模型和 User.currentBookId 字段，新增/修改 API 路由，
创建 `useServerData` hook 使用 SWR 缓存服务器数据，创建 `useLearningData` 统一 hook
根据登录状态自动路由到本地 store 或服务器 API。所有页面迁移到统一 hook。

**Tech Stack:** Next.js 14, Prisma 5, PostgreSQL, SWR, Zustand, NextAuth.js

---

## Phase 1: 数据库 + API（后端）

### Task 1: Schema 变更

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/types/index.ts`

**Step 1:** 在 `User` 模型中添加字段：
```prisma
currentBookId  String?  // 当前选择的词库 ID
settings       UserSettings?
```

**Step 2:** 新增 `UserSettings` 模型：
```prisma
model UserSettings {
  id               String  @id @default(cuid())
  userId           String  @unique
  dailyNewWords    Int     @default(20)
  dailyReviewWords Int     @default(50)
  autoPlayAudio    Boolean @default(true)
  showPhonetic     Boolean @default(true)
  pronunciation    String  @default("en-US")  // en-US | en-GB
  theme            String  @default("system")  // light | dark | system

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

**Step 3:** 更新 `src/types/index.ts` 添加 `ServerUserSettings` 类型。

**Step 4:** 运行 `npx prisma db push` 验证 schema 无误。

**Step 5:** 提交。

---

### Task 2: 用户设置 API

**Files:**
- Create: `src/app/api/user/settings/route.ts`

**Step 1:** 实现 `GET /api/user/settings`：
- 需要认证
- 查询 `UserSettings`，不存在则返回默认值
- 返回 `UserSettings` JSON

**Step 2:** 实现 `PUT /api/user/settings`：
- 需要认证
- 接收 `Partial<UserSettings>` body
- upsert 到数据库
- 返回更新后的设置

**Step 3:** 提交。

---

### Task 3: 当前词库 API

**Files:**
- Create: `src/app/api/user/current-book/route.ts`

**Step 1:** 实现 `GET /api/user/current-book`：
- 需要认证
- 返回 `{ currentBookId: string | null }`

**Step 2:** 实现 `PUT /api/user/current-book`：
- 需要认证
- 接收 `{ bookId: string }` body
- 更新 `User.currentBookId`
- 返回更新后的值

**Step 3:** 提交。

---

### Task 4: 学习会话 API

**Files:**
- Create: `src/app/api/sessions/route.ts`

**Step 1:** 实现 `POST /api/sessions`：
- 需要认证
- 接收会话数据 body
- 创建 `LearningSession` 记录
- 返回创建的会话

**Step 2:** 实现 `GET /api/sessions`：
- 需要认证
- 返回最近 100 条会话记录

**Step 3:** 提交。

---

## Phase 2: Server Data Hook（前端基础设施）

### Task 5: 安装 SWR

**Files:**
- Modify: `package.json`

**Step 1:** `npm install swr`

**Step 2:** 提交。

---

### Task 6: 创建 useServerData hook

**Files:**
- Create: `src/lib/use-server-data.ts`

**核心设计：**
- 使用 SWR 缓存所有服务器数据
- 暴露与 `useLearningStore` 相同接口的方法
- 写操作使用 SWR 的 `mutate` 做乐观更新

**接口：**
```typescript
interface ServerData {
  // 状态
  currentBookId: string | null;
  wordProgress: Record<string, LocalWordProgress>;
  dailyStats: Record<string, LocalDailyStats>;
  sessions: LocalSession[];
  settings: UserSettings;
  localAchievements: Record<string, LocalAchievementProgress>;

  // 词库选择
  setCurrentBook: (bookId: string) => void;

  // 单词学习
  getWordProgress: (wordId: string) => LocalWordProgress | undefined;
  updateWordProgress: (wordId: string, quality: number) => void;

  // 获取待学习/复习单词
  getNewWordIds: (bookWordIds: string[], limit: number) => string[];
  getReviewWordIds: (bookWordIds: string[], limit: number) => string[];

  // 统计
  getTodayStats: () => LocalDailyStats;
  getStreak: () => number;
  getWordStatusCounts: (bookWordIds: string[]) => Record<WordStatus, number>;

  // 学习时长
  addStudyMinutes: (minutes: number) => void;

  // 会话
  addSession: (session: ...) => void;

  // 设置
  updateSettings: (settings: Partial<UserSettings>) => void;

  // 成就
  checkLocalAchievements: () => AchievementResult[];

  // 数据管理
  clearAllData: () => void;
  exportData: () => string;

  // 加载状态
  isLoading: boolean;
}
```

**实现要点：**
- `wordProgress`: SWR 从 `GET /api/progress` 获取
- `dailyStats`: SWR 从 `GET /api/daily-stats` 获取
- `settings`: SWR 从 `GET /api/user/settings` 获取
- `currentBookId`: SWR 从 `GET /api/user/current-book` 获取
- `sessions`: SWR 从 `GET /api/sessions` 获取
- 写操作：乐观更新 SWR 缓存 + 异步 POST/PUT API
- `updateWordProgress`: 调用 SM-2 算法计算新参数 → 乐观更新 → POST /api/progress
- `addStudyMinutes`: 乐观更新 → POST /api/daily-stats

**Step 1:** 创建 `src/lib/use-server-data.ts`，实现完整 hook。

**Step 2:** 提交。

---

### Task 7: 创建 useLearningData 统一 hook

**Files:**
- Create: `src/lib/use-learning-data.ts`

**设计：**
```typescript
export function useLearningData() {
  const { data: session } = useSession();
  const isAuthenticated = session?.user != null;

  // 登录用户 → 服务器数据
  const serverData = useServerData();
  // 未登录用户 → 本地 store
  const localStore = useLearningStore();
  const hydrated = useStoreHydrated();

  if (isAuthenticated) {
    return { ...serverData, hydrated: !serverData.isLoading };
  }
  return { ...localStore, hydrated, isLoading: false };
}
```

**Step 1:** 创建 `src/lib/use-learning-data.ts`。

**Step 2:** 提交。

---

## Phase 3: 页面迁移

### Task 8-12: 逐页迁移

将所有使用 `useLearningStore` 的页面和组件迁移到 `useLearningData`。

**迁移清单：**
- `src/app/page.tsx` — 首页仪表盘
- `src/app/learn/page.tsx` — 学习入口
- `src/app/learn/new/page.tsx` — 新词学习
- `src/app/learn/review/page.tsx` — 复习
- `src/app/learn/spell/page.tsx` — 拼写
- `src/app/learn/quiz/page.tsx` — 测验
- `src/app/wordbooks/page.tsx` — 词库列表
- `src/app/wordbooks/[bookId]/page.tsx` — 词库详情
- `src/app/stats/page.tsx` — 统计
- `src/app/profile/page.tsx` — 个人中心
- `src/components/word/flash-card.tsx` — 闪卡
- `src/components/word/quiz-card.tsx` — 测验卡
- `src/components/word/spell-card.tsx` — 拼写卡
- `src/lib/use-study-timer.ts` — 学习计时器

**迁移方式：**
每个文件将 `useLearningStore` 替换为 `useLearningData`，
将 `useStoreHydrated` 替换为 `useLearningData` 返回的 `hydrated`。

每 3-4 个文件一次提交。

---

## Phase 4: 清理 + 迁移

### Task 13: 登录迁移流程

**Files:**
- Modify: `src/components/layout/sync-provider.tsx`

**设计：** 用户登录时，检测本地是否有数据：
1. 如有 wordProgress → 推送到 `/api/progress`
2. 如有 dailyStats → 推送到 `/api/daily-stats`
3. 如有 settings → 推送到 `/api/user/settings`
4. 如有 currentBookId → 推送到 `/api/user/current-book`
5. 推送完成后清除本地 store

### Task 14: 移除旧同步逻辑

**Files:**
- Delete: `src/lib/sync.ts`（或保留给迁移用，标记 deprecated）
- Modify: `src/lib/store.ts` — 移除 `pushSingleWord`, `pushDailyStats` 调用
- Modify: `src/components/layout/sync-provider.tsx` — 简化为仅做迁移

---

## Phase 5: 验证 + 部署

### Task 15: 全量验证

- 运行所有测试
- 构建验证
- 手动测试：未登录用户流程、登录用户流程、多设备一致性

### Task 16: 提交 + 部署

- 更新 CHANGELOG.md
- 提交并推送
- 服务器部署
