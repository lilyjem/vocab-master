# VocabMaster 项目架构文档

## 架构概览

VocabMaster 采用 Next.js 14 全栈架构，前后端同构，登录用户采用 server-first 数据策略：

```
┌─────────────────────────────────────────────────┐
│                    客户端                         │
│  Next.js App Router + React 18 + Zustand/SWR   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  页面组件  │  │ UI 组件  │  │   状态管理    │  │
│  └────┬─────┘  └──────────┘  └──────┬───────┘  │
│       │                             │            │
│       │  fetch()              Zustand(本地)      │
│       │                       SWR(登录用户)      │
│       ↓                        localStorage     │
├─────────────────────────────────────────────────┤
│                    API 层                        │
│  Next.js API Routes (/api/*)                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐  │
│  │词库 API│ │认证 API│ │进度 API│ │用户 API │  │
│  └───┬────┘ └───┬────┘ └───┬────┘ └────┬────┘  │
│      │          │          │            │        │
│  ┌───────┐ ┌────────┐ ┌─────────┐ ┌────────┐   │
│  │收藏夹 │ │成就 API│ │会话 API │ │统计 API│   │
│  └───┬───┘ └───┬────┘ └────┬────┘ └───┬────┘   │
│      │         │           │           │         │
│      ↓         ↓           ↓           ↓         │
├─────────────────────────────────────────────────┤
│                    数据层                         │
│  Prisma ORM + NextAuth.js                       │
│  ┌──────────────────────────────────────────┐   │
│  │              PostgreSQL 16                │   │
│  │  users / words / word_books /             │   │
│  │  user_word_progress / sessions /          │   │
│  │  achievements / folders / settings ...    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 核心模块

### 1. 页面路由 (`src/app/`)

采用 Next.js App Router，所有页面为客户端组件（`"use client"`），支持 Zustand/SWR 状态管理。

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 未登录→产品落地页，已登录→仪表盘 |
| `/wordbooks` | 词库列表 | 6 大考试词库浏览 |
| `/wordbooks/[bookId]` | 词库详情 | 单词列表、分页、搜索 |
| `/learn` | 学习中心 | 选择学习模式入口 |
| `/learn/new` | 新词学习 | 翻转卡片 + SM-2 评分 |
| `/learn/review` | 复习模式 | SM-2 推送到期单词 |
| `/learn/spell` | 拼写测试 | 看释义拼写英文 |
| `/learn/quiz` | 选择题 | 四选一测验 |
| `/stats` | 学习统计 | 趋势图表、日历、正确率 |
| `/profile` | 个人中心 | 设置、数据导出、主题、成就展示 |
| `/profile/account` | 账户安全 | 修改密码、变更邮箱、注销账户 |
| `/favorites` | 收藏夹 | 用户自定义单词收藏夹列表 |
| `/favorites/[folderId]` | 收藏夹详情 | 查看收藏夹中的单词 |
| `/auth/login` | 登录 | 邮箱/OAuth 登录 |
| `/auth/register` | 注册 | 邮箱注册 |
| `/auth/forgot-password` | 忘记密码 | 发送密码重置邮件 |
| `/auth/reset-password` | 重置密码 | 通过邮件链接重置 |
| `/auth/verify-email` | 邮箱验证 | 验证注册/变更邮箱 |

### 2. 状态管理

采用双层数据架构：未登录用户使用 Zustand + localStorage，登录用户使用 SWR + 服务端数据。

#### Zustand Store (`src/lib/store.ts`)

本地状态管理，通过 `persist` 中间件持久化到 `localStorage`：

```
Zustand Store
├── currentBookId           # 当前选择的词库 ID
├── settings                # 用户设置
│   ├── dailyNewWords       # 每日新词数量
│   ├── dailyReviewWords    # 每日复习数量
│   ├── pronunciation       # 发音类型 (en-US / en-GB)
│   ├── autoPlayAudio       # 自动播放发音
│   ├── showPhonetic        # 显示音标
│   ├── theme               # 主题 (light / dark / system)
│   └── wordOrder           # 学习顺序 (freq-desc / freq-asc / alpha / random)
├── wordProgress            # 单词学习进度 (SM-2 参数)
│   └── [wordId]            # repetitions / EF / interval / status / updatedAt
├── dailyStats              # 每日统计
│   └── [date]              # wordsLearned / wordsReviewed / studyMinutes
├── sessions                # 本地学习会话记录
├── localAchievements       # 本地成就进度（未登录用户）
├── shownAchievementTiers   # 已展示成就等级（避免重复弹窗）
└── actions                 # 操作方法
    ├── setCurrentBook()
    ├── updateSettings()
    ├── updateWordProgress()     # 记录学习结果
    ├── getNewWordIds()          # 获取新词列表
    ├── getReviewWordIds()       # 获取待复习列表
    ├── getTodayStats()          # 获取今日统计
    ├── getStreak()              # 计算连续打卡天数
    ├── getWordStatusCounts()    # 统计各状态单词数量
    ├── addStudyMinutes()        # 追加学习时长
    ├── addSession()             # 添加学习会话
    ├── mergeCloudProgress()     # 合并云端进度
    ├── mergeCloudDailyStats()   # 合并云端每日统计
    ├── checkLocalAchievements() # 本地成就计算
    ├── markAchievementShown()   # 标记成就已展示
    ├── clearAllData()           # 清除所有数据
    └── exportData()             # 导出学习数据
```

#### 服务端数据 (`src/lib/use-server-data.ts`)

登录用户使用 SWR 从服务端拉取数据，支持乐观更新和实时同步。

#### 统一数据接口 (`src/lib/use-learning-data.ts`)

对外提供统一的 `useLearningData()` Hook，内部根据登录状态自动切换本地/服务端数据源。

**Hydration 处理**: 使用 `hydrated` 标志确保 SSR 和 CSR 状态一致，避免 hydration mismatch。

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

**单词状态判定**:

| 条件 | 状态 |
|------|------|
| `repetitions=0 && interval=0` | `new` — 新词 |
| `repetitions < 2` | `learning` — 学习中 |
| `interval >= 21` | `mastered` — 已掌握 |
| 其他 | `review` — 复习中 |

### 4. 成就系统 (`src/lib/achievements.ts`)

7 级段位体系，支持本地（未登录）和服务端（已登录）双模式。

**成就等级**: 青铜 → 白银 → 黄金 → 铂金 → 钻石 → 大师 → 王者

**成就类型**: 词汇学徒、坚持达人、复习达人、拼写大师、百词斩、马拉松、完成词书、夜猫子、早起鸟、周末战士

### 5. 云端同步 (`src/lib/sync.ts`)

登录用户的数据实时同步到云端：

```
本地操作 → Zustand Store → SyncProvider 监听变化 → POST /api/progress
                                                  → POST /api/daily-stats
                                                  → POST /api/sessions
```

**冲突策略**: 按 `updatedAt` 时间戳做冲突检测，取最新数据。

### 6. 发音模块 (`src/lib/audio.ts`)

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

### 7. 组件架构 (`src/components/`)

```
components/
├── ui/                    # 基础 UI 原子组件
│   ├── button.tsx         # 按钮（多种 variant）
│   ├── card.tsx           # 卡片容器
│   ├── badge.tsx          # 标签徽章
│   ├── input.tsx          # 输入框
│   ├── progress.tsx       # 进度条
│   ├── skeleton.tsx       # 骨架屏
│   ├── loading-spinner.tsx    # 加载动画
│   ├── password-strength.tsx  # 密码强度指示
│   └── study-skeleton.tsx     # 学习页骨架屏
├── layout/                # 布局组件
│   ├── navbar.tsx         # 顶部导航栏（桌面端）
│   ├── mobile-nav.tsx     # 底部导航栏（移动端）
│   ├── theme-provider.tsx # 主题切换 Provider
│   ├── auth-provider.tsx  # 认证 Provider
│   ├── conditional-nav.tsx    # 条件渲染导航
│   ├── conditional-main.tsx   # 条件渲染主内容区
│   └── sync-provider.tsx      # 云端同步 Provider
├── word/                  # 单词学习核心组件
│   ├── flash-card.tsx     # 翻转卡片（正面英文、背面释义）
│   ├── quiz-card.tsx      # 选择题卡片（四选一）
│   ├── spell-card.tsx     # 拼写测试卡片
│   ├── quality-buttons.tsx    # SM-2 评分按钮组
│   ├── example-sentences.tsx  # 例句面板
│   ├── favorite-button.tsx    # 收藏按钮
│   └── etymology-panel.tsx    # 词源面板
├── landing/               # 落地页组件
│   └── landing-page.tsx   # 未登录首页产品介绍
├── dashboard/             # 仪表盘组件
│   └── dashboard.tsx      # 已登录首页仪表盘
├── achievements/          # 成就相关组件
│   ├── achievement-toast.tsx      # 成就弹窗通知
│   ├── achievement-card.tsx       # 成就卡片
│   └── achievement-celebration.tsx # 成就解锁庆祝动画
└── stats/                 # 统计图表组件
    ├── learning-chart.tsx     # 学习趋势折线图
    └── streak-calendar.tsx    # 打卡日历
```

### 8. 核心库文件 (`src/lib/`)

| 文件 | 功能 |
|------|------|
| `store.ts` | Zustand 本地状态管理 |
| `use-learning-data.ts` | 统一学习数据 Hook（自动切换本地/服务端） |
| `use-server-data.ts` | 服务端数据 Hook（SWR + 乐观更新） |
| `sm2.ts` | SM-2 间隔重复算法 |
| `achievements.ts` | 成就系统逻辑 |
| `sync.ts` | 云端同步引擎 |
| `audio.ts` | 发音模块 |
| `utils.ts` | 工具函数 |
| `auth.ts` | NextAuth 配置 |
| `db.ts` | Prisma 数据库连接 |
| `dictionary-api.ts` | 外部词典 API（例句、词源） |
| `cache.ts` | 接口缓存（内存缓存） |
| `validation.ts` | 表单验证 |
| `email.ts` | 邮件发送（SMTP） |
| `login-limiter.ts` | 登录限流 |
| `use-book-words.ts` | 词库单词 Hook（SWR 预取） |
| `use-keyboard-shortcuts.ts` | 键盘快捷键 |
| `use-study-timer.ts` | 学习计时器 |

---

## 数据库设计

### ER 模型

```
User (1) ──→ (N) Account            NextAuth OAuth 账号
User (1) ──→ (N) Session            NextAuth 会话
User (1) ──→ (N) UserWordProgress   SM-2 学习进度
User (1) ──→ (N) LearningSession    学习会话记录
User (1) ──→ (N) DailyCheckIn       每日打卡
User (1) ──→ (1) UserSettings       用户学习设置
User (1) ──→ (N) UserAchievement    用户成就进度
User (1) ──→ (N) WordFolder         用户收藏夹

WordBook (1) ──→ (N) Word           词库包含单词
Word (1) ──→ (N) UserWordProgress   单词的用户进度
Word (1) ──→ (N) FolderWord         单词的收藏关联

WordFolder (1) ──→ (N) FolderWord   收藏夹-单词关联
Achievement (1) ──→ (N) UserAchievement  成就定义-用户进度

VerificationToken                    邮箱验证令牌
WordExample                          例句缓存
WordEtymology                        词源缓存
```

### 数据表说明

| 模型 | 表名 | 说明 |
|------|------|------|
| `User` | `users` | 用户（含 currentBookId） |
| `Account` | `accounts` | OAuth 账号 |
| `Session` | `sessions` | NextAuth 会话 |
| `VerificationToken` | `verification_tokens` | 邮箱/密码重置验证令牌 |
| `UserSettings` | `user_settings` | 用户学习设置 |
| `WordBook` | `word_books` | 词库 |
| `Word` | `words` | 单词（含 frequency 词频） |
| `UserWordProgress` | `user_word_progress` | SM-2 学习进度 |
| `LearningSession` | `learning_sessions` | 学习会话记录 |
| `DailyCheckIn` | `daily_check_ins` | 每日打卡 |
| `Achievement` | `achievements` | 成就定义 |
| `UserAchievement` | `user_achievements` | 用户成就进度 |
| `WordExample` | `word_examples` | 例句缓存 |
| `WordEtymology` | `word_etymologies` | 词源缓存 |
| `WordFolder` | `word_folders` | 用户收藏夹 |
| `FolderWord` | `folder_words` | 收藏夹-单词关联 |

### 关键索引

| 模型 | 索引 | 用途 |
|------|------|------|
| `Word` | `bookId` | 按词库查询单词 |
| `Word` | `word` | 按单词搜索 |
| `UserWordProgress` | `userId + status` | 按状态查询用户进度 |
| `UserWordProgress` | `userId + nextReviewDate` | 查询到期复习单词 |
| `LearningSession` | `userId + startTime` | 按时间查询学习记录 |
| `DailyCheckIn` | `userId + checkInDate` | 查询打卡记录 |
| `WordFolder` | `userId` | 查询用户收藏夹 |
| `FolderWord` | `folderId + wordId` | 收藏夹单词唯一约束 |
| `WordExample` | `word` | 按单词查例句缓存 |
| `WordEtymology` | `word` | 按单词查词源缓存 |

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
    ├── 环境变量: SMTP 配置（邮件发送）
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
  → 安装 openssl（Prisma 运行时依赖）
  → 复制 standalone 输出
  → 复制 Prisma client + schema + seed 数据
  → 复制 tsx + esbuild（运行 seed 脚本）
  → 以 nextjs:1001 用户运行
```

---

## 测试策略

- **单元测试**: Jest + ts-jest，覆盖核心库（SM-2 算法、表单验证、工具函数、Zustand Store、成就系统）
- **浏览器测试**: 通过 Cursor MCP 浏览器自动化，覆盖所有页面和交互流程
- **测试数量**: 210+ 个单元测试 + 55 个浏览器验证用例

```bash
# 运行单元测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```
