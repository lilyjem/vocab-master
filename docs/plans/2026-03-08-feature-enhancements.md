# VocabMaster 功能增强实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 VocabMaster 添加性能优化、词频排序、成就系统、例句学习、词根分析 5 项功能增强

**Architecture:** 基于现有 Next.js 14 + Prisma + Zustand 架构，新增数据库模型、API 路由和前端组件。性能优化使用虚拟列表和缓存策略，外部数据通过 API 代理层获取并缓存。

**Tech Stack:** Next.js 14, Prisma 5, PostgreSQL, Zustand, @tanstack/react-virtual, Free Dictionary API

---

## Phase 1: 全面性能优化

### Task 1.1: 安装虚拟列表依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装 @tanstack/react-virtual**

Run: `npm install @tanstack/react-virtual`

**Step 2: 验证安装成功**

Run: `npm ls @tanstack/react-virtual`
Expected: 显示版本号

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: 安装 @tanstack/react-virtual 虚拟列表依赖"
```

---

### Task 1.2: 词书详情页虚拟列表改造

**Files:**
- Modify: `src/app/wordbooks/[bookId]/page.tsx`
- Test: `src/app/wordbooks/__tests__/book-detail-virtual.test.tsx`

**Step 1: 编写虚拟列表渲染测试**

```typescript
// src/app/wordbooks/__tests__/book-detail-virtual.test.tsx
import { describe, it, expect } from "@jest/globals";

describe("BookDetailPage 虚拟列表", () => {
  it("应该只渲染可视区域内的词条", () => {
    // 模拟 1000 个单词，验证 DOM 中只有约 20-30 个元素
  });

  it("滚动后应该渲染新的词条", () => {
    // 模拟滚动，验证新元素出现
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npx jest src/app/wordbooks/__tests__/book-detail-virtual.test.tsx --no-cache`
Expected: FAIL

**Step 3: 改造词书详情页使用虚拟列表**

修改 `src/app/wordbooks/[bookId]/page.tsx`：
- 引入 `useVirtualizer` from `@tanstack/react-virtual`
- 将单词列表 `.map()` 替换为虚拟化渲染
- 设置 `estimateSize` 为每行约 60px
- 添加滚动容器 ref
- 保留搜索和分页功能不变

**Step 4: 运行测试确认通过**

Run: `npx jest src/app/wordbooks/__tests__/book-detail-virtual.test.tsx --no-cache`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/wordbooks/
git commit -m "perf: 词书详情页使用虚拟列表优化大词书渲染性能"
```

---

### Task 1.3: API 响应缓存

**Files:**
- Create: `src/lib/cache.ts`
- Modify: `src/app/api/words/route.ts`
- Modify: `src/app/api/words/[bookId]/route.ts`
- Test: `src/lib/__tests__/cache.test.ts`

**Step 1: 编写内存缓存工具测试**

```typescript
// src/lib/__tests__/cache.test.ts
import { describe, it, expect } from "@jest/globals";

describe("MemoryCache", () => {
  it("应该缓存并返回数据", () => {});
  it("过期后应该返回 undefined", () => {});
  it("应该支持手动清除缓存", () => {});
});
```

**Step 2: 运行测试确认失败**

Run: `npx jest src/lib/__tests__/cache.test.ts --no-cache`
Expected: FAIL

**Step 3: 实现内存缓存工具**

```typescript
// src/lib/cache.ts
// 简单的内存缓存，TTL 过期策略
// 词书列表缓存 5 分钟，单词数据缓存 10 分钟
```

**Step 4: 运行测试确认通过**

Run: `npx jest src/lib/__tests__/cache.test.ts --no-cache`
Expected: PASS

**Step 5: 在 API 路由中使用缓存**

修改 `src/app/api/words/route.ts` 和 `src/app/api/words/[bookId]/route.ts`：
- 词书列表 GET 请求使用 5 分钟缓存
- 单词数据 GET 请求使用 10 分钟缓存
- 缓存 key 包含查询参数

**Step 6: Commit**

```bash
git add src/lib/cache.ts src/lib/__tests__/cache.test.ts src/app/api/words/
git commit -m "perf: 添加 API 响应内存缓存，词书列表 5 分钟、单词数据 10 分钟"
```

---

### Task 1.4: 首屏加载优化 - 懒加载非关键组件

**Files:**
- Modify: `src/app/stats/page.tsx`
- Modify: `src/components/stats/learning-chart.tsx` (如果需要)

**Step 1: 使用 next/dynamic 懒加载 Recharts 图表组件**

修改 `src/app/stats/page.tsx`：
- 将 LearningChart 和 StreakCalendar 改为 `dynamic(() => import(...), { ssr: false })`
- 添加 loading 骨架屏占位

**Step 2: 验证构建成功**

Run: `npm run build`
Expected: 构建成功，stats 页面的 JS bundle 减小

**Step 3: Commit**

```bash
git add src/app/stats/ src/components/stats/
git commit -m "perf: 懒加载统计页图表组件，减少首屏 JS 体积"
```

---

## Phase 2: 智能学习顺序 - 词频优先

### Task 2.1: Word 模型添加 frequency 字段

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/types/index.ts`

**Step 1: 在 schema.prisma 的 Word 模型中添加 frequency 字段**

在 `difficulty` 字段下方添加：
```prisma
frequency      Int    @default(0) // 词频排名（数值越大越常用）
```

**Step 2: 在 types/index.ts 的 Word 接口中添加 frequency**

```typescript
frequency?: number;
```

**Step 3: 推送数据库变更**

Run: `npx prisma db push`
Expected: 成功添加 frequency 列

**Step 4: Commit**

```bash
git add prisma/schema.prisma src/types/index.ts
git commit -m "feat: Word 模型添加 frequency 词频字段"
```

---

### Task 2.2: 创建词频数据匹配脚本

**Files:**
- Create: `prisma/seed/frequency-data.ts`
- Create: `prisma/seed/coca-frequency.json` (COCA 词频数据)
- Test: `prisma/__tests__/frequency-data.test.ts`

**Step 1: 编写词频匹配测试**

```typescript
// prisma/__tests__/frequency-data.test.ts
describe("词频数据匹配", () => {
  it("应该为已知单词返回词频值", () => {});
  it("未知单词应该返回默认值 0", () => {});
  it("高频词的 frequency 值应该大于低频词", () => {});
});
```

**Step 2: 运行测试确认失败**

Run: `npx jest prisma/__tests__/frequency-data.test.ts --no-cache`
Expected: FAIL

**Step 3: 准备 COCA 词频数据**

创建 `prisma/seed/coca-frequency.json`，包含 COCA 前 20000 词的词频排名。
格式：`{ "the": 20000, "be": 19999, "to": 19998, ... }`
（数值越大越常用）

**Step 4: 实现词频匹配函数**

```typescript
// prisma/seed/frequency-data.ts
// 从 coca-frequency.json 加载词频数据
// 提供 getWordFrequency(word: string): number 函数
```

**Step 5: 运行测试确认通过**

Run: `npx jest prisma/__tests__/frequency-data.test.ts --no-cache`
Expected: PASS

**Step 6: Commit**

```bash
git add prisma/seed/frequency-data.ts prisma/seed/coca-frequency.json prisma/__tests__/frequency-data.test.ts
git commit -m "feat: 创建 COCA 词频数据和匹配函数"
```

---

### Task 2.3: 种子脚本集成词频数据

**Files:**
- Modify: `prisma/seed/index.ts`

**Step 1: 修改种子脚本，在导入单词时设置 frequency**

在 `prisma/seed/index.ts` 中：
- 导入 `getWordFrequency` 函数
- 在 `prisma.word.create` 时添加 `frequency: getWordFrequency(word.word)`

**Step 2: 运行种子脚本验证**

Run: `npx prisma db seed`
Expected: 成功，单词带有 frequency 值

**Step 3: 验证数据**

Run: `npx prisma studio`
检查 Word 表中 frequency 字段是否有值

**Step 4: Commit**

```bash
git add prisma/seed/index.ts
git commit -m "feat: 种子脚本集成词频数据，导入时自动匹配 COCA 词频"
```

---

### Task 2.4: 新词学习按词频排序

**Files:**
- Modify: `src/app/api/words/[bookId]/route.ts`
- Modify: `src/lib/store.ts`
- Test: `src/lib/__tests__/store.test.ts`

**Step 1: 编写词频排序测试**

在 `src/lib/__tests__/store.test.ts` 中添加测试：
```typescript
describe("getNewWordIds 词频排序", () => {
  it("应该按词频从高到低返回新词", () => {});
});
```

**Step 2: 运行测试确认失败**

Run: `npx jest src/lib/__tests__/store.test.ts --no-cache`
Expected: 新测试 FAIL

**Step 3: 修改 API 返回单词时包含 frequency 字段**

修改 `src/app/api/words/[bookId]/route.ts`：
- 查询时 `select` 包含 `frequency`
- 添加 `orderBy: { frequency: "desc" }` 排序选项

**Step 4: 修改 store 的 getNewWordIds 支持词频排序**

修改 `src/lib/store.ts` 的 `getNewWordIds`：
- 接受 `words: Word[]` 参数（包含 frequency）
- 按 frequency 降序排列后取前 limit 个

**Step 5: 运行测试确认通过**

Run: `npx jest src/lib/__tests__/store.test.ts --no-cache`
Expected: PASS

**Step 6: Commit**

```bash
git add src/app/api/words/ src/lib/store.ts src/lib/__tests__/store.test.ts
git commit -m "feat: 新词学习按 COCA 词频从高到低排序"
```

---

## Phase 3: 成就系统 - 分级徽章

### Task 3.1: 成就数据模型

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/types/index.ts`

**Step 1: 在 schema.prisma 中添加 Achievement 和 UserAchievement 模型**

```prisma
// ========== 成就定义 ==========
model Achievement {
  id               String @id @default(cuid())
  code             String @unique // 成就代码（如 vocab_learner, streak_master）
  name             String // 成就名称
  description      String // 成就描述
  category         String // 分类: learning, streak, review, accuracy, spelling, book, time, habit
  icon             String // 图标名称（lucide-react 图标）
  bronzeThreshold  Int    // 铜牌阈值
  silverThreshold  Int    // 银牌阈值
  goldThreshold    Int    // 金牌阈值

  userAchievements UserAchievement[]

  @@map("achievements")
}

// ========== 用户成就进度 ==========
model UserAchievement {
  id            String    @id @default(cuid())
  userId        String
  achievementId String
  tier          String    @default("none") // none, bronze, silver, gold
  progress      Int       @default(0) // 当前进度值
  unlockedAt    DateTime? // 最近一次升级时间
  notified      Boolean   @default(false) // 是否已通知用户

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@index([userId])
  @@map("user_achievements")
}
```

**Step 2: 在 User 模型中添加关联**

```prisma
achievements   UserAchievement[]
```

**Step 3: 在 types/index.ts 中添加类型**

```typescript
export type AchievementTier = "none" | "bronze" | "silver" | "gold";

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  tier: AchievementTier;
  progress: number;
  unlockedAt?: string;
  achievement?: Achievement;
}
```

**Step 4: 推送数据库变更**

Run: `npx prisma db push`
Expected: 成功创建 achievements 和 user_achievements 表

**Step 5: Commit**

```bash
git add prisma/schema.prisma src/types/index.ts
git commit -m "feat: 添加 Achievement 和 UserAchievement 数据模型"
```

---

### Task 3.2: 成就种子数据

**Files:**
- Create: `prisma/seed/achievements.ts`
- Modify: `prisma/seed/index.ts`

**Step 1: 创建成就种子数据**

```typescript
// prisma/seed/achievements.ts
// 8 个成就的定义数据
export const ACHIEVEMENTS = [
  { code: "vocab_learner", name: "词汇新手", category: "learning", icon: "BookOpen", bronze: 50, silver: 500, gold: 2000 },
  { code: "streak_master", name: "坚持不懈", category: "streak", icon: "Flame", bronze: 3, silver: 14, gold: 30 },
  // ... 其余 6 个
];
```

**Step 2: 在种子脚本中导入成就数据**

修改 `prisma/seed/index.ts`，添加成就数据的 upsert 逻辑。

**Step 3: 运行种子脚本**

Run: `npx prisma db seed`
Expected: 成功插入 8 条成就记录

**Step 4: Commit**

```bash
git add prisma/seed/achievements.ts prisma/seed/index.ts
git commit -m "feat: 添加 8 个成就的种子数据"
```

---

### Task 3.3: 成就检查引擎

**Files:**
- Create: `src/lib/achievements.ts`
- Test: `src/lib/__tests__/achievements.test.ts`

**Step 1: 编写成就检查测试**

```typescript
// src/lib/__tests__/achievements.test.ts
describe("AchievementEngine", () => {
  it("学习 50 词应该解锁词汇新手铜牌", () => {});
  it("学习 500 词应该升级到银牌", () => {});
  it("连续打卡 3 天应该解锁坚持不懈铜牌", () => {});
  it("进度不足时不应该解锁", () => {});
  it("应该返回新解锁的成就列表", () => {});
});
```

**Step 2: 运行测试确认失败**

Run: `npx jest src/lib/__tests__/achievements.test.ts --no-cache`
Expected: FAIL

**Step 3: 实现成就检查引擎**

```typescript
// src/lib/achievements.ts
// checkAchievements(userId, stats) => { unlocked: UserAchievement[], updated: UserAchievement[] }
// 纯函数，接收用户统计数据，返回需要更新的成就
```

**Step 4: 运行测试确认通过**

Run: `npx jest src/lib/__tests__/achievements.test.ts --no-cache`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/achievements.ts src/lib/__tests__/achievements.test.ts
git commit -m "feat: 实现成就检查引擎，支持 8 种成就的铜/银/金判定"
```

---

### Task 3.4: 成就 API 路由

**Files:**
- Create: `src/app/api/achievements/route.ts`

**Step 1: 实现成就 API**

```typescript
// GET /api/achievements - 获取用户所有成就进度
// POST /api/achievements/check - 触发成就检查，返回新解锁的成就
```

**Step 2: 验证 API 可用**

Run: `npm run dev` 然后用 curl 测试
Expected: GET 返回成就列表，POST 返回检查结果

**Step 3: Commit**

```bash
git add src/app/api/achievements/
git commit -m "feat: 添加成就 API 路由（GET 列表 + POST 检查）"
```

---

### Task 3.5: 成就本地 Store 支持

**Files:**
- Modify: `src/lib/store.ts`
- Modify: `src/types/index.ts`

**Step 1: 在 store 中添加本地成就状态**

```typescript
// 在 LearningStore 接口中添加：
localAchievements: Record<string, { tier: AchievementTier; progress: number }>;
checkLocalAchievements: () => { code: string; tier: AchievementTier; name: string }[];
```

**Step 2: 实现本地成就检查逻辑**

基于 wordProgress、dailyStats 等本地数据计算成就进度。

**Step 3: Commit**

```bash
git add src/lib/store.ts src/types/index.ts
git commit -m "feat: Zustand store 添加本地成就状态和检查逻辑"
```

---

### Task 3.6: 成就展示 UI

**Files:**
- Create: `src/components/achievements/achievement-card.tsx`
- Create: `src/components/achievements/achievement-toast.tsx`
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 创建成就卡片组件**

展示成就图标、名称、描述、当前等级、进度条。
铜/银/金用不同颜色标注。

**Step 2: 创建成就解锁 toast 组件**

新成就解锁时弹出动画通知。

**Step 3: 在个人资料页添加成就标签页**

展示所有 8 个成就的进度。

**Step 4: 在首页仪表盘添加最近成就**

展示最近解锁的 1-2 个成就。

**Step 5: Commit**

```bash
git add src/components/achievements/ src/app/profile/ src/app/page.tsx
git commit -m "feat: 成就展示 UI - 卡片、toast 通知、个人资料页、首页"
```

---

## Phase 4: 例句上下文学习

### Task 4.1: 例句缓存模型

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: 添加 WordExample 模型**

```prisma
model WordExample {
  id          String   @id @default(cuid())
  wordText    String   // 查询的单词
  sentence    String   // 英文例句
  translation String?  // 中文翻译
  source      String   @default("free-dictionary") // 数据来源
  fetchedAt   DateTime @default(now())

  @@index([wordText])
  @@map("word_examples")
}
```

**Step 2: 推送数据库变更**

Run: `npx prisma db push`

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: 添加 WordExample 模型用于缓存外部例句"
```

---

### Task 4.2: 例句 API 路由

**Files:**
- Create: `src/app/api/words/examples/route.ts`
- Create: `src/lib/dictionary-api.ts`
- Test: `src/lib/__tests__/dictionary-api.test.ts`

**Step 1: 编写词典 API 客户端测试**

```typescript
// src/lib/__tests__/dictionary-api.test.ts
describe("DictionaryAPI", () => {
  it("应该从 Free Dictionary API 获取例句", () => {});
  it("API 失败时应该返回空数组", () => {});
  it("应该正确解析 API 响应格式", () => {});
});
```

**Step 2: 运行测试确认失败**

Run: `npx jest src/lib/__tests__/dictionary-api.test.ts --no-cache`
Expected: FAIL

**Step 3: 实现词典 API 客户端**

```typescript
// src/lib/dictionary-api.ts
// fetchExamples(word: string): Promise<{ sentence: string; translation?: string }[]>
// 调用 https://api.dictionaryapi.dev/api/v2/entries/en/{word}
// 从 meanings[].definitions[].example 提取例句
```

**Step 4: 实现例句 API 路由**

```typescript
// src/app/api/words/examples/route.ts
// GET /api/words/examples?word=xxx
// 1. 查数据库缓存
// 2. 未命中则调用外部 API
// 3. 存入缓存
// 4. 返回例句列表
```

**Step 5: 运行测试确认通过**

Run: `npx jest src/lib/__tests__/dictionary-api.test.ts --no-cache`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/dictionary-api.ts src/lib/__tests__/dictionary-api.test.ts src/app/api/words/examples/
git commit -m "feat: 例句 API - Free Dictionary API 客户端和缓存路由"
```

---

### Task 4.3: 卡片组件添加例句展示

**Files:**
- Modify: `src/components/word/flash-card.tsx`
- Create: `src/components/word/example-sentences.tsx`

**Step 1: 创建例句展示组件**

```typescript
// src/components/word/example-sentences.tsx
// 接收 word: string，点击展开后请求 /api/words/examples
// 展示例句列表，高亮目标单词
// 加载中显示骨架屏
```

**Step 2: 在 FlashCard 中集成例句组件**

在卡片背面（释义下方）添加"查看例句"按钮和例句展示区域。

**Step 3: Commit**

```bash
git add src/components/word/
git commit -m "feat: 卡片组件集成例句展示，支持点击加载外部例句"
```

---

## Phase 5: 词根词缀分析

### Task 5.1: 词源缓存模型

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: 添加 WordEtymology 模型**

```prisma
model WordEtymology {
  id           String   @id @default(cuid())
  wordText     String   @unique // 查询的单词
  roots        Json?    // 词根列表 [{ root: "rupt", meaning: "break" }]
  prefixes     Json?    // 前缀列表 [{ prefix: "inter-", meaning: "between" }]
  suffixes     Json?    // 后缀列表 [{ suffix: "-tion", meaning: "noun" }]
  origin       String?  // 词源描述
  relatedWords Json?    // 同根词列表
  fetchedAt    DateTime @default(now())

  @@map("word_etymologies")
}
```

**Step 2: 推送数据库变更**

Run: `npx prisma db push`

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: 添加 WordEtymology 模型用于缓存词源数据"
```

---

### Task 5.2: 词源 API 路由

**Files:**
- Create: `src/app/api/words/etymology/route.ts`
- Modify: `src/lib/dictionary-api.ts`
- Test: `src/lib/__tests__/dictionary-api.test.ts`

**Step 1: 在词典 API 客户端中添加词源获取函数**

```typescript
// 在 src/lib/dictionary-api.ts 中添加：
// fetchEtymology(word: string): Promise<EtymologyData>
// 从 Free Dictionary API 的 origin 字段提取词源
// 解析词根词缀（基于常见词根词缀表匹配）
```

**Step 2: 实现词源 API 路由**

```typescript
// src/app/api/words/etymology/route.ts
// GET /api/words/etymology?word=xxx
// 1. 查数据库缓存
// 2. 未命中则调用外部 API + 词根匹配
// 3. 存入缓存
// 4. 返回词源数据
```

**Step 3: 编写测试并验证**

**Step 4: Commit**

```bash
git add src/lib/dictionary-api.ts src/lib/__tests__/dictionary-api.test.ts src/app/api/words/etymology/
git commit -m "feat: 词源 API - 外部 API 获取 + 词根词缀匹配 + 缓存"
```

---

### Task 5.3: 卡片组件添加词根分析展示

**Files:**
- Create: `src/components/word/etymology-panel.tsx`
- Modify: `src/components/word/flash-card.tsx`

**Step 1: 创建词根分析面板组件**

```typescript
// src/components/word/etymology-panel.tsx
// 接收 word: string，点击展开后请求 /api/words/etymology
// 可视化展示：前缀（蓝色）+ 词根（绿色）+ 后缀（橙色）
// 展示词源描述和同根词
```

**Step 2: 在 FlashCard 中集成词根分析**

在卡片背面添加"词根分析"按钮和展示区域。

**Step 3: Commit**

```bash
git add src/components/word/
git commit -m "feat: 卡片组件集成词根词缀分析展示"
```

---

## Phase 6: 全量验证

### Task 6.1: 运行全部测试

**Step 1: 运行所有单元测试**

Run: `npm test`
Expected: 所有测试通过

**Step 2: 运行构建验证**

Run: `npm run build`
Expected: 构建成功，无错误

**Step 3: 运行 lint 检查**

Run: `npm run lint`
Expected: 无 lint 错误

---

### Task 6.2: 更新文档

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/API.md`
- Modify: `docs/ARCHITECTURE.md`

**Step 1: 更新 CHANGELOG**

添加 v1.1.0 版本记录，列出所有新功能。

**Step 2: 更新 API 文档**

添加新增的 API 路由文档。

**Step 3: 更新架构文档**

添加成就系统、缓存层、外部 API 集成的说明。

**Step 4: Commit**

```bash
git add CHANGELOG.md docs/
git commit -m "docs: 更新文档 - CHANGELOG v1.1.0、API 文档、架构文档"
```
