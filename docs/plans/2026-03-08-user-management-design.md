# 设计文档：用户管理功能增强

## 背景

当前用户系统仅支持邮箱注册/登录，缺少密码管理、邮箱验证、账户管理等基础功能。

## 功能清单

### 1. 密码修改
- 个人中心新增"修改密码"区域
- 输入旧密码 + 新密码 + 确认新密码
- API: `PUT /api/user/password`

### 2. 密码重置（忘记密码）
- 登录页新增"忘记密码"链接
- 流程：输入邮箱 → 发送重置链接（含 token）→ 重置页面输入新密码
- Token 存入 VerificationToken 表，有效期 1 小时
- 页面: `/auth/forgot-password`, `/auth/reset-password`
- API: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

### 3. 邮箱验证
- 注册后自动发送验证邮件
- 点击链接后标记 emailVerified
- 未验证用户可正常使用，个人中心显示"未验证"提示
- API: `POST /api/auth/send-verification`, `GET /api/auth/verify-email?token=xxx`

### 4. 登录安全
- 同一邮箱 5 次失败后锁定 15 分钟
- 使用内存缓存记录失败次数
- 显示剩余尝试次数

### 5. 编辑个人资料
- 个人中心修改昵称
- API: `PUT /api/user/profile`

### 6. 注销账户
- 需要输入密码确认
- 级联删除所有关联数据
- API: `DELETE /api/user/account`

### 7. 修改邮箱
- 输入密码验证身份 → 输入新邮箱 → 发送验证邮件 → 确认后更新
- API: `POST /api/user/change-email`

### 8. 密码强度指示器
- 纯前端组件
- 根据长度/大小写/数字/特殊字符评分
- 弱/中/强三级带颜色条

## 技术方案

### 邮件服务
- QQ 邮箱 SMTP
- nodemailer 发送
- 环境变量: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

### Token 管理
- 复用 NextAuth VerificationToken 模型
- 生成随机 token + 过期时间
- 使用后立即删除

### 登录限流
- 内存缓存（MemoryCache）记录 email → 失败次数
- 5 次失败后锁定 15 分钟
- 成功登录后清除计数
