# VocabMaster 项目架构文档

## 架构概览

VocabMaster 采用 Next.js 14 全栈架构，前后端同构：

```
┌─────────────────────────────────────────────┐
│                  客户端                      │
│  Next.js App Router + React 18 + Zustand   │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 页面组件 │  │ UI 组件  │  │ 状态管理  │  │
│  └────┬────┘  └──────────┘  └─────┬────┘  │
│       │                           │         │
│       │  fetch()                  │ Zustand │
│       ↓                      localStorage  │
├─────────────────────────────────────────────┤
│                  API 层                      │
│  Next.js API Routes (/api/*)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 词库 API  │  │ 认证 API │  │ 进度 API │  │
│  └────┬────┘  └─────┬────┘  └─────┬────┘  │
│       │              │             │         │
│       ↓              ↓             ↓         │
├─────────────────────────────────────────────┤
│                  数据层                      │
│  Prisma ORM + NextAuth.js                   │
│  ┌──────────────────────────────────────┐   │
│  │            PostgreSQL 16              │   │
│  │  users / words / word_books /         │   │
│  │  user_word_progress / sessions ...    │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 核心模块

### 1. 页面路由 (`src/app/`)

采用 Next.js App Router，所有页面为客户端组件（`"use client"`），支持 Zustand 状态管理。

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页仪表盘 | 今日学习统计、快捷入口 |
| `/wordbooks` | 词库列表 | 6 大考试词库浏览 |
| `/wordbooks/[bookId]` | 词库详情 | 单词列表、分页、搜索 |
| `/learn` | 学习中心 | 选择学习模式入口 |
| `/learn/new` | 新词学习 | 翻转卡片 + SM-2 评分 |
| `/learn/review` | 复习模式 | SM-2 推送到期单词 |
| `/learn/spell` | 拼写测试 | 看释义拼写英文 |
| `/learn/quiz` | 选择题 | 四选一测验 |
| `/stats` | 学习统计 | 趋势图表、日历、正确率 |
| `/profile` | 个人中心 | 设置、数据导出、主题 |
| `/auth/login` | 登录 | 邮箱/OAuth 登录 |
| `/auth/register` | 注册 | 邮箱注册 |

### 2. 状态管理 (`src/lib/store.ts`)

使用 Zustand 管理客户端状态，通过 `persist` 中间件将数据持久化到 `localStorage`：

```
Zustand Store
├── currentBookId        # 当前选择的词库 ID
├── settings             # 用户设置
│   ├── dailyNewWords    # 每日新词数量
│   ├── dailyReview      # 每日复习数量
│   ├── pronunciation    # 发音类型 (en-US / en-GB)
│   ├── autoPlay         # 自动播放发音
│   └── showPhonetic     # 显示音标
├── wordProgress         # 单词学习进度 (SM-2 参数)
│   └── [wordId]         # 每个单词的 repetitions / EF / interval
├── dailyStats           # 每日统计
│   └── [date]           # 新学/复习/正确数/时长
├── streak               # 连续打卡天数
├── lastCheckInDate      # 最后打卡日期
└── actions              # 操作方法
    ├── setCurrentBook()
    ├── updateSettings()
    ├── recordWordProgress()
    ├── getNewWordIds()
    ├── getReviewWordIds()
    └── exportData()
```

**Hydration 处理**: 使用自定义 `useStoreHydrated()` hook 确保 SSR 和 CSR 状态一致，避免 hydration mismatch。

### 3. SM-2 算法 (`src/lib/sm2.ts`)

SuperMemo 2 间隔重复算法的纯函数实现：

```
输入: quality (0-5), 当前参数 { repetitions, easinessFactor, interval }
                    │
                    ▼
          ┌── quality < 3 ──→ 重置 repetitions=0, interval=1
          │
quality ──┤── quality ≥ 3
          │     ├── rep=0 → interval=1
          │     ├── rep=1 → interval=6
          │     └── rep≥2 → interval = interval × EF
          │
          └──→ 更新 EF = max(1.3, EF + 0.1 - (5-q)×(0.08+(5-q)×0.02))
                    │
                    ▼
输出: { repetitions, easinessFactor, interval, nextReviewDate }
```

### 4. 发音模块 (`src/lib/audio.ts`)

统一的发音管理，支持美式/英式切换：

```
playWordAudio(word, pronunciation)
        │
        ▼
  有道词典 TTS API
  type=0 (美式) / type=1 (英式)
        │
    成功 ┤ 失败
        │     │
   播放 MP3   └──→ Web Speech API (回退方案)
```

### 5. 组件架构 (`src/components/`)

```
components/
├── ui/                 # 基础 UI 原子组件
│   ├── button.tsx      # 按钮（多种 variant）
│   ├── card.tsx        # 卡片容器
│   ├── badge.tsx       # 标签徽章
│   ├── input.tsx       # 输入框
│   └── progress.tsx    # 进度条
├── layout/             # 布局组件
│   ├── navbar.tsx      # 顶部导航栏（桌面端）
│   ├── mobile-nav.tsx  # 底部导航栏（移动端）
│   └── theme-provider.tsx  # 主题切换 Provider
├── word/               # 单词学习核心组件
│   ├── flash-card.tsx  # 翻转卡片（正面英文、背面释义）
│   ├── quiz-card.tsx   # 选择题卡片（四选一）
│   ├── spell-card.tsx  # 拼写测试卡片
│   └── quality-buttons.tsx  # SM-2 评分按钮组
└── stats/              # 统计图表组件
    ├── learning-chart.tsx   # 学习趋势折线图
    └── streak-calendar.tsx  # 打卡日历
```

---

## 数据库设计

### ER 模型

```
User (1) ──→ (N) Account          NextAuth OAuth 账号
User (1) ──→ (N) Session          NextAuth 会话
User (1) ──→ (N) UserWordProgress SM-2 学习进度
User (1) ──→ (N) LearningSession  学习会话记录
User (1) ──→ (N) DailyCheckIn     每日打卡

WordBook (1) ──→ (N) Word          词库包含单词
Word (1) ──→ (N) UserWordProgress  单词的用户进度
```

### 关键索引

| 模型 | 索引 | 用途 |
|------|------|------|
| `Word` | `bookId` | 按词库查询单词 |
| `Word` | `word` | 按单词搜索 |
| `UserWordProgress` | `userId + status` | 按状态查询用户进度 |
| `UserWordProgress` | `userId + nextReviewDate` | 查询到期复习单词 |
| `LearningSession` | `userId + startTime` | 按时间查询学习记录 |
| `DailyCheckIn` | `userId + checkInDate` | 查询打卡记录 |

---

## 部署架构

### Docker 容器编排

```
docker-compose.yml
├── db (PostgreSQL 16 Alpine)
│   ├── 端口: 5432
│   ├── 数据卷: postgres_data
│   └── 健康检查: pg_isready
└── app (Next.js standalone)
    ├── 端口: 3000
    ├── 多阶段构建 (deps → builder → runner)
    ├── docker-entrypoint.sh
    │   ├── 等待数据库就绪（最多 30 次重试）
    │   ├── prisma db push（同步 schema）
    │   ├── 条件导入种子数据（WordBook 为空时）
    │   └── exec node server.js
    └── depends_on: db (service_healthy)
```

### 镜像构建流程

```
Stage 1: deps
  → npm ci（安装全部依赖）

Stage 2: builder
  → prisma generate（生成客户端）
  → npm run build（Next.js standalone 构建）

Stage 3: runner (node:20-alpine)
  → 复制 standalone 输出
  → 复制 Prisma client + schema + seed 数据
  → 复制 tsx + esbuild（运行 seed 脚本）
  → 以 nextjs:1001 用户运行
```

---

## 测试策略

- **单元测试**: Jest + ts-jest，覆盖核心库（SM-2 算法、表单验证、工具函数、Zustand Store）
- **浏览器测试**: 通过 Cursor MCP 浏览器自动化，覆盖所有页面和交互流程
- **测试数量**: 210 个单元测试 + 55 个浏览器验证用例

```bash
# 运行单元测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```
