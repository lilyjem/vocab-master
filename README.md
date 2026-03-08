# VocabMaster - 英语词汇学习平台

<p align="center">
  <strong>基于 SM-2 间隔重复算法的智能英语词汇学习平台</strong>
</p>

<p align="center">
  <a href="#功能特色">功能特色</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#docker-部署">Docker 部署</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#api-接口">API 接口</a> •
  <a href="#贡献指南">贡献指南</a>
</p>

---

## 功能特色

### 📚 六大考试词库

内置 **29,474** 个精选单词，覆盖主流英语考试：

| 词库 | 词汇量 | 难度 | 适合人群 |
|------|--------|------|---------|
| CET-4 | 4,533 | 初级 | 大学英语四级考生 |
| CET-6 | 2,220 | 中级 | 大学英语六级考生 |
| 考研英语 | 5,390 | 中级 | 考研学生 |
| IELTS | 8,496 | 中高级 | 雅思考生 |
| TOEFL | 4,510 | 中高级 | 托福考生 |
| GRE | 4,325 | 高级 | GRE 考生 |

### 🧠 SM-2 记忆算法

采用 SuperMemo 2 间隔重复算法，根据你的掌握程度智能安排复习：

- **评分 0-2**：遗忘，重置复习间隔
- **评分 3**：勉强记住，短间隔复习
- **评分 4**：记住了，正常间隔
- **评分 5**：完全掌握，延长间隔

核心参数：
- `EF`（Easiness Factor）：难度因子，最低 1.3
- `interval`：复习间隔天数
- `repetitions`：连续正确次数

### 📖 多种学习模式

| 模式 | 说明 |
|------|------|
| 卡片翻转 | 正面英文、背面释义和例句，支持四级评分 |
| 复习模式 | SM-2 算法推送到期单词，科学复习 |
| 拼写测试 | 看中文释义拼写英文，强化拼写记忆 |
| 选择题 | 四选一快速测验，巩固词义理解 |

### 🔊 双语发音

- 支持**美式发音**和**英式发音**切换（使用有道词典 TTS API）
- 个人中心全局设置，所有学习页面自动生效
- 离线时自动回退到 Web Speech API

### 📊 学习统计

- 每日打卡与连续天数追踪
- 学习趋势图表（Recharts）
- 薄弱单词分析
- 累计学习词汇与正确率统计

### 🔐 可选登录

- 未登录：数据自动保存到浏览器本地（localStorage）
- 登录后：学习进度同步到云端数据库
- 支持邮箱注册和 OAuth 第三方登录（GitHub、Google）

### 🌙 主题切换

支持亮色 / 暗色 / 跟随系统三种主题模式。

---

## 技术栈

| 分类 | 技术 |
|------|------|
| **框架** | [Next.js 14](https://nextjs.org/)（App Router） |
| **UI** | [Tailwind CSS 4](https://tailwindcss.com/) + shadcn/ui 风格组件 |
| **状态管理** | [Zustand](https://zustand-demo.pmnd.rs/)（localStorage 持久化） |
| **数据库** | [PostgreSQL 16](https://www.postgresql.org/) + [Prisma 5](https://www.prisma.io/) ORM |
| **认证** | [NextAuth.js](https://next-auth.js.org/) |
| **图表** | [Recharts](https://recharts.org/) |
| **发音** | 有道词典 TTS API + Web Speech API（回退） |
| **测试** | [Jest](https://jestjs.io/) + 210 个单元测试 |
| **部署** | [Docker](https://www.docker.com/) 多阶段构建 |

---

## 快速开始

### 环境要求

- **Node.js** 18+
- **PostgreSQL** 14+（或使用 Docker）
- **npm** 9+

### 1. 克隆项目

```bash
git clone https://github.com/<your-username>/vocab-master.git
cd vocab-master
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接和密钥：

```env
# 数据库连接地址（请修改密码）
DATABASE_URL="postgresql://vocab:<你的密码>@localhost:5432/vocabmaster?schema=public"

# NextAuth 配置（生产环境请使用 openssl rand -base64 32 生成）
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<请生成强随机字符串>"

# 百度翻译 API（用于例句中文翻译和词库数据生成，可选）
BAIDU_TRANSLATE_APPID=""
BAIDU_TRANSLATE_SECRET=""
```

### 4. 启动数据库

使用 Docker Compose 启动 PostgreSQL：

```bash
docker compose up -d db
```

或连接已有的 PostgreSQL 实例，修改 `.env` 中的 `DATABASE_URL`。

### 5. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库 schema
npm run db:push

# 导入词库种子数据（6 大词库，约 29,474 个单词）
npm run db:seed
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

---

## Docker 部署

### 一键部署（推荐）

```bash
# 构建并启动所有服务（PostgreSQL + Next.js 应用）
docker compose up -d
```

容器启动时会自动：
1. 等待数据库就绪
2. 同步数据库 schema（`prisma db push`）
3. 首次启动时自动导入全部词库数据
4. 启动 Next.js 应用

访问 [http://localhost:3000](http://localhost:3000)。

### 自定义配置

编辑 `docker-compose.yml` 修改端口、密码等：

```yaml
services:
  db:
    environment:
      POSTGRES_USER: vocab                # 数据库用户名
      POSTGRES_PASSWORD: <你的数据库密码>   # 通过 .env 文件配置
      POSTGRES_DB: vocabmaster             # 数据库名
  app:
    ports:
      - "3000:3000"                        # 映射端口
    environment:
      NEXTAUTH_SECRET: <你的密钥>           # 通过 .env 文件配置
```

### 停止和清理

```bash
# 停止服务
docker compose down

# 停止并删除数据卷（清除所有数据）
docker compose down -v
```

---

## 项目结构

```
vocab-master/
├── prisma/                     # 数据库相关
│   ├── schema.prisma           # 数据库模型定义（7 个模型）
│   └── seed/                   # 词库种子数据
│       ├── index.ts            # 种子导入脚本
│       ├── fetch-wordlists.ts  # 词库数据获取脚本
│       ├── cet4/               # CET-4 词库数据
│       ├── cet6/               # CET-6 词库数据
│       ├── postgrad/           # 考研词库数据
│       ├── ielts/              # IELTS 词库数据
│       ├── toefl/              # TOEFL 词库数据
│       └── gre/                # GRE 词库数据
├── src/
│   ├── app/                    # Next.js 页面（App Router）
│   │   ├── page.tsx            # 首页仪表盘
│   │   ├── api/                # API 路由
│   │   │   ├── auth/           # 认证 API（注册、NextAuth）
│   │   │   ├── words/          # 词库 & 单词 API
│   │   │   ├── progress/       # 学习进度 API
│   │   │   └── stats/          # 统计数据 API
│   │   ├── auth/               # 登录 / 注册页面
│   │   ├── learn/              # 学习模式页面
│   │   │   ├── page.tsx        # 学习中心
│   │   │   ├── new/            # 新词学习
│   │   │   ├── review/         # 复习模式
│   │   │   ├── spell/          # 拼写测试
│   │   │   └── quiz/           # 选择题
│   │   ├── wordbooks/          # 词库浏览
│   │   ├── stats/              # 学习统计
│   │   └── profile/            # 个人中心
│   ├── components/             # React 组件
│   │   ├── ui/                 # 基础 UI 组件（Button、Card、Badge 等）
│   │   ├── layout/             # 布局组件（Navbar、MobileNav、ThemeProvider）
│   │   ├── word/               # 单词学习组件（FlashCard、QuizCard、SpellCard）
│   │   └── stats/              # 统计图表组件（LearningChart、StreakCalendar）
│   ├── lib/                    # 核心库
│   │   ├── sm2.ts              # SM-2 间隔重复算法实现
│   │   ├── store.ts            # Zustand 状态管理（学习进度、设置）
│   │   ├── audio.ts            # 发音工具（有道 TTS + Web Speech 回退）
│   │   ├── db.ts               # Prisma 数据库客户端
│   │   ├── auth.ts             # NextAuth 配置
│   │   ├── utils.ts            # 工具函数
│   │   └── validation.ts       # 表单验证
│   └── types/                  # TypeScript 类型定义
├── docker-compose.yml          # Docker 编排配置
├── Dockerfile                  # 多阶段 Docker 构建
├── docker-entrypoint.sh        # 容器启动脚本
├── jest.config.ts              # Jest 测试配置
├── next.config.mjs             # Next.js 配置
├── tailwind.config.ts          # Tailwind CSS 配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 项目依赖和脚本
```

---

## API 接口

### 词库相关

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/words` | 获取所有词库列表 |
| `GET` | `/api/words/[bookId]` | 获取词库详情和单词列表 |
| `GET` | `/api/words/[bookId]?all=true` | 获取词库全部单词（学习模式用） |
| `GET` | `/api/words/[bookId]?page=1&pageSize=50` | 分页获取单词列表 |
| `GET` | `/api/words/[bookId]?search=keyword` | 搜索词库中的单词 |

### 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/register` | 邮箱注册新用户 |
| `POST/GET` | `/api/auth/[...nextauth]` | NextAuth 认证路由 |

### 学习进度

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/progress` | 提交单词学习进度（SM-2 评分） |
| `GET` | `/api/stats` | 获取学习统计数据 |

---

## 数据库模型

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐
│   User      │────→│   Account    │     │ UserWordProgress  │
│             │────→│   Session    │     │  (SM-2 算法数据)   │
│             │────→│ LearningSession│   │  repetitions      │
│             │────→│ DailyCheckIn │     │  easinessFactor    │
│             │────→│              │     │  interval          │
│             │     │              │     │  nextReviewDate    │
└─────────────┘     └──────────────┘     └───────────────────┘
                                                   ↑
┌─────────────┐     ┌──────────────┐               │
│  WordBook   │────→│    Word      │───────────────┘
│  (6 个词库)  │     │ (29,474 词) │
└─────────────┘     └──────────────┘
```

---

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint 代码检查 |
| `npm run test` | 运行单元测试 |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run test:coverage` | 生成测试覆盖率报告 |
| `npm run db:generate` | 生成 Prisma 客户端 |
| `npm run db:push` | 推送数据库 schema |
| `npm run db:seed` | 导入词库种子数据 |
| `npm run db:studio` | 打开 Prisma Studio 数据库管理 |
| `npm run db:migrate` | 执行数据库迁移 |

---

## 贡献指南

欢迎贡献！请遵循以下步骤：

### 1. Fork 并克隆

```bash
git clone https://github.com/<your-username>/vocab-master.git
cd vocab-master
```

### 2. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 3. 开发规范

- **代码风格**：遵循 ESLint 配置，提交前运行 `npm run lint`
- **测试**：新功能必须编写对应测试，运行 `npm run test` 确保全部通过
- **提交消息**：使用中文描述，简明扼要
  ```
  feat: 添加生词本导出功能
  fix: 修复暗色模式下卡片样式异常
  docs: 更新 API 文档
  refactor: 重构 SM-2 算法实现
  ```

### 4. 提交 Pull Request

- 确保所有测试通过
- 描述清楚改动内容和目的
- 如涉及 UI 变更，附上截图

---

## 环境变量

| 变量 | 说明 | 必填 | 默认值 |
|------|------|------|--------|
| `POSTGRES_PASSWORD` | 数据库密码 | ✅ | （必须设置强密码） |
| `DATABASE_URL` | PostgreSQL 连接地址 | ✅ | （参考 .env.example） |
| `NEXTAUTH_URL` | 网站访问地址 | ✅ | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth JWT 密钥 | ✅ | （使用 `openssl rand -base64 32` 生成） |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | ❌ | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | ❌ | - |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ❌ | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ❌ | - |
| `BAIDU_TRANSLATE_APPID` | 百度翻译 APP ID | ❌ | - |
| `BAIDU_TRANSLATE_SECRET` | 百度翻译密钥 | ❌ | - |
| `SMTP_HOST` | 邮箱 SMTP 服务器 | ❌ | `smtp.qq.com` |
| `SMTP_PORT` | SMTP 端口 | ❌ | `465` |
| `SMTP_USER` | SMTP 用户名（邮箱地址） | ❌ | - |
| `SMTP_PASS` | SMTP 授权码 | ❌ | - |
| `NEXT_PUBLIC_APP_URL` | 应用公开访问 URL | ❌ | `http://localhost:3000` |

---

## License

[MIT](LICENSE) © Jem
