# 更新日志

所有重大变更记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [1.5.0] - 2026-03-12

### 新增

- **成就庆祝动画**: 成就解锁时全屏庆祝通知效果

### 修复

- 修复个人中心账户安全与成就卡片间距不一致

---

## [1.4.0] - 2026-03-10

### 新增

- **成就 7 级段位**: 成就等级升级为 7 级段位体系（青铜→白银→黄金→铂金→钻石→大师→王者）
- **SEO 优化**: 全面 SEO 优化（meta 标签、Open Graph、结构化数据）
- **快捷键**: 新增键盘快捷键支持（空格翻转卡片、方向键切换等）
- **新成就**: 新增 4 个成就（坚持达人、拼写大师等）
- **收藏夹**: 创建、管理自定义单词收藏夹，支持添加/移除单词
- **学习顺序**: 新增学习顺序设置（高频词 / 低频词 / 字母序 / 随机）
- **落地页**: 新增首页落地页，未登录用户看到产品介绍
- **例句翻译**: 例句增加百度翻译中文翻译

### 优化

- **SWR 全局缓存**: SWR 全局缓存共享消除学习子页面加载延迟
- 优化学习页面加载速度

### 修复

- 修复拼写测试和选择题测验的单词闪过问题
- 修复随机模式学习中单词闪过问题
- 空格键翻转卡片时自动播放发音
- 修复"复习达人"成就统计口径，新词学习不再计入复习次数

### 新增 API

- `GET /api/folders` - 获取收藏夹列表
- `POST /api/folders` - 创建收藏夹
- `GET /api/folders/:folderId` - 获取收藏夹详情
- `PUT /api/folders/:folderId` - 更新收藏夹
- `DELETE /api/folders/:folderId` - 删除收藏夹
- `POST /api/folders/:folderId/words` - 添加单词到收藏夹
- `DELETE /api/folders/:folderId/words` - 从收藏夹移除单词

### API 变更

- `GET /api/words/:bookId` - 新增 `order` 参数（学习顺序）、`ids` 参数（轻量模式）

### 数据模型变更

- 新增 `WordFolder` 模型（用户收藏夹）
- 新增 `FolderWord` 模型（收藏夹-单词关联）

### 新增页面

- `/favorites` - 收藏夹列表
- `/favorites/[folderId]` - 收藏夹详情

---

## [1.3.0] - 2026-03-08

### 用户管理增强

- **密码修改**: 个人中心可修改密码（验证旧密码）
- **密码重置**: 忘记密码通过邮件重置（QQ 邮箱 SMTP）
- **邮箱验证**: 注册后自动发送验证邮件，个人中心显示验证状态
- **登录安全**: 同一邮箱 5 次失败后锁定 15 分钟
- **编辑昵称**: 个人中心可修改昵称
- **注销账户**: 输入密码确认后删除账户及所有数据
- **修改邮箱**: 通过邮件验证更换绑定邮箱
- **密码强度指示器**: 注册和修改密码时实时显示密码强度

### 重构

- 拆分个人中心页面，账户安全功能独立为子页面
- 代码规范全面修复（ESLint / TypeScript / 可访问性 / 输入验证）

### 安全

- 安全审查修复：移除硬编码凭证和敏感信息

### 修复

- 修复进度同步 500 错误和 favicon 404
- 例句和词源 API 请求添加 basePath 前缀
- 修复 checkLocalAchievements 在渲染期间调用 set() 导致 React 无限循环
- 退出登录后重定向到 /vocab 子路径而非域名根路径
- Dockerfile runner 安装 openssl + Prisma binaryTargets
- tsconfig 添加 target es2017 修复 Set 迭代编译错误
- docker-compose 添加 SMTP 环境变量

### 新增页面

- `/profile/account` - 账户安全页面
- `/auth/forgot-password` - 忘记密码页面
- `/auth/reset-password` - 密码重置页面
- `/auth/verify-email` - 邮箱验证页面

### 新增 API

- `PUT /api/user/password` - 修改密码
- `GET/PUT /api/user/profile` - 个人资料
- `DELETE /api/user/account` - 注销账户
- `POST /api/user/change-email` - 修改邮箱
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重置密码
- `GET/POST /api/auth/verify-email` - 邮箱验证

---

## [1.2.0] - 2026-03-08

### 架构重构

- **登录用户数据全面服务器化**: 登录用户的所有学习数据以服务器为唯一真实来源（server-first），消除多设备数据差异
- **统一数据访问层**: 新增 `useLearningData` hook，根据登录状态自动路由到服务器 API 或本地 localStorage
- **SWR 缓存**: 登录用户使用 SWR 缓存服务器数据，乐观更新保证 UI 即时响应
- **登录数据迁移**: 首次登录时自动将本地 localStorage 数据迁移到服务器，迁移后清除本地缓存
- **移除双向同步**: 登录用户不再需要本地-云端双向同步，直接读写服务器

### 新增

- **用户设置 API**: `GET/PUT /api/user/settings` 服务器端存储用户学习设置
- **当前词库 API**: `GET/PUT /api/user/current-book` 服务器端存储当前选择的词库
- **学习会话 API**: `GET/POST /api/sessions` 服务器端存储学习会话记录
- **每日统计 API**: `GET/POST /api/daily-stats` 每日学习数据云端同步
- **学习时间追踪**: 实现学习时间自动追踪功能

### 数据模型变更

- `User` 模型新增 `currentBookId` 字段（当前选择的词库）
- 新增 `UserSettings` 模型（用户学习设置：每日新词数、发音类型、主题等）

### API 变更

- `GET /api/progress` - 响应格式改为 `Record<wordId, Progress>` 结构
- `POST /api/progress` - 新增 `updatedAt` 冲突检测机制

---

## [1.1.0] - 2026-03-08

### 新增

- **成就系统**: 8 个分级成就（铜/银/金），包括词汇新手、坚持不懈、复习达人、精准射手、拼写高手、词书征服者、学习时长、早起鸟
- **例句上下文学习**: 学习卡片中可查看更多例句，从 Free Dictionary API 实时获取并缓存
- **词根词缀分析**: 学习卡片中展示单词的词根、词缀拆解，帮助理解和记忆
- **智能学习顺序**: 基于 COCA 词频表（约 2500 词），新词学习按词频从高到低排序，先学最常用的词
- **成就 API**: `GET/POST /api/achievements` 支持成就进度查询和检查
- **例句 API**: `GET /api/words/examples?word=xxx` 获取单词例句
- **词源 API**: `GET /api/words/etymology?word=xxx` 获取词根词缀分析
- **骨架屏组件**: 统计页图表加载时显示骨架屏占位

### 优化

- **虚拟列表**: 词书详情页使用 `@tanstack/react-virtual` 虚拟滚动，大词书渲染性能显著提升
- **API 缓存**: 词书列表（5 分钟）和单词数据（10 分钟）内存缓存，减轻数据库压力
- **懒加载**: 统计页图表组件（Recharts）使用 `next/dynamic` 懒加载，减小首屏 JS 体积

### 数据模型变更

- `Word` 模型新增 `frequency` 字段（词频排名）
- 新增 `Achievement` 模型（成就定义）
- 新增 `UserAchievement` 模型（用户成就进度）
- 新增 `WordExample` 模型（例句缓存）
- 新增 `WordEtymology` 模型（词源缓存）

---

## [1.0.0] - 2026-03-05

### 新增

- **六大考试词库**: CET-4（4,533 词）、CET-6（2,220 词）、考研（5,390 词）、IELTS（8,496 词）、TOEFL（4,510 词）、GRE（4,325 词）
- **SM-2 记忆算法**: 完整实现 SuperMemo 2 间隔重复算法
- **四种学习模式**: 卡片翻转、复习模式、拼写测试、选择题
- **学习统计**: 每日打卡、学习趋势图表、正确率统计、薄弱词分析
- **双语发音**: 美式/英式发音切换（有道词典 TTS API），Web Speech API 回退
- **用户认证**: 邮箱注册登录、GitHub/Google OAuth（可选）
- **本地优先**: 未登录时数据保存在 localStorage，登录后可同步到云端
- **暗色模式**: 亮色/暗色/跟随系统主题
- **Docker 部署**: 一键 `docker compose up` 部署，自动初始化数据库和导入词库
- **响应式设计**: 桌面端顶部导航 + 移动端底部导航
- **词库分页**: 大词库（GRE 4,325 词）分页加载，支持搜索
- **210 个单元测试**: 覆盖 SM-2 算法、表单验证、工具函数、Zustand Store
