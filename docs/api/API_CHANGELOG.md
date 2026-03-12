# API Changelog

本文件记录 API 接口的所有变更。

## [Unreleased]

暂无未发布的接口变更。

---

## [1.3.0] - 2026-03-10

### 接口变更
- `GET /api/achievements` - 成就等级升级为 7 级段位体系

---

## [1.2.0] - 2026-03-08

### 新增接口
- `GET /api/folders` - 获取用户收藏夹列表
- `POST /api/folders` - 创建收藏夹
- `GET /api/folders/:folderId` - 获取收藏夹详情
- `PUT /api/folders/:folderId` - 更新收藏夹
- `DELETE /api/folders/:folderId` - 删除收藏夹
- `POST /api/folders/:folderId/words` - 添加单词到收藏夹
- `DELETE /api/folders/:folderId/words` - 从收藏夹移除单词

### 接口变更
- `GET /api/words/:bookId` - 新增 `order` 参数，支持学习顺序（高频词/低频词/字母序/随机）
- `GET /api/words/:bookId` - 新增 `ids` 参数，支持只返回 ID 列表的轻量模式

---

## [1.1.0] - 2026-03-05

### 新增接口
- `GET /api/daily-stats` - 拉取每日统计数据
- `POST /api/daily-stats` - 推送每日统计到云端
- `GET /api/sessions` - 获取学习会话记录
- `POST /api/sessions` - 创建学习会话
- `GET /api/user/profile` - 获取用户个人资料
- `PUT /api/user/profile` - 更新个人资料
- `PUT /api/user/password` - 修改密码
- `GET /api/user/settings` - 获取用户设置
- `PUT /api/user/settings` - 更新用户设置
- `GET /api/user/current-book` - 获取当前词库
- `PUT /api/user/current-book` - 更新当前词库
- `POST /api/user/change-email` - 变更邮箱
- `DELETE /api/user/account` - 注销账户
- `GET /api/achievements` - 获取成就进度
- `POST /api/achievements` - 检查并更新成就
- `GET /api/words/examples` - 获取单词例句
- `GET /api/words/etymology` - 获取单词词源
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重置密码
- `GET /api/auth/verify-email` - 邮箱验证（点击链接）
- `POST /api/auth/verify-email` - 重新发送验证邮件

### 接口变更
- `GET /api/progress` - 响应格式改为 `Record<wordId, Progress>` 结构
- `POST /api/progress` - 新增 `updatedAt` 冲突检测机制，响应增加 `skipped` 字段

---

## [1.0.0] - 2026-02-28

### 新增接口
- `GET /api/words` - 获取词库列表
- `GET /api/words/:bookId` - 获取词库详情（分页/全量）
- `POST /api/auth/register` - 用户注册
- `POST/GET /api/auth/[...nextauth]` - NextAuth 认证
- `GET /api/progress` - 获取学习进度
- `POST /api/progress` - 同步学习进度
- `GET /api/stats` - 获取学习统计
