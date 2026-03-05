# Ralph Agent Log

This file tracks what each agent run has completed. Append your changes below.

---

## 2026-03-05 - 浏览器自动化验证全部页面 + API 错误处理修复

**Task:** 创建 User Stories 并通过浏览器自动化验证所有页面和按钮流程

**Changes:**

- `src/app/wordbooks/page.tsx` - 修复 API 返回非数组数据时 books.map 崩溃
- `src/app/wordbooks/[bookId]/page.tsx` - 修复 API 错误处理，使用 Array.isArray 验证
- `src/app/learn/page.tsx` - 修复 API 错误处理
- `src/app/learn/new/page.tsx` - 修复 API 错误处理
- `src/app/learn/review/page.tsx` - 修复 API 错误处理
- `src/app/learn/spell/page.tsx` - 修复 API 错误处理
- `src/app/learn/quiz/page.tsx` - 修复 API 错误处理
- `src/app/stats/page.tsx` - 修复 API 错误处理（catch 之前为空函数）
- `docs/user-stories/` - 创建 7 个 User Story 文件，共 22 个用例

**Bug 发现和修复:**
1. **books.map is not a function** - 当数据库不可用时，API 返回错误对象而非数组，导致词库页面崩溃。修复方法：所有 API 调用处添加 `Array.isArray()` 验证。
2. **catch 处理不完善** - 多个页面的 catch 回调未正确重置状态或设置 loading=false。

**Status:** Completed

**Notes:** 所有 22 个 User Stories 验证通过。8 个页面的 API 错误处理已修复。

---

## 2026-03-05 - Docker 部署 + 数据导入 + 有数据场景完整测试

**Task:** 使用 Docker 部署 PostgreSQL，导入词汇数据，测试所有页面的有数据场景

**Changes:**

- `src/lib/store.ts` - 新增 `useStoreHydrated()` hook，解决 Zustand persist hydration 竞态问题
- `src/app/learn/quiz/page.tsx` - 修复 hydration 导致的错误重定向
- `src/app/learn/spell/page.tsx` - 修复 hydration 导致的错误重定向
- `src/app/learn/review/page.tsx` - 修复 hydration 导致的错误重定向
- `src/app/learn/new/page.tsx` - 修复 hydration 导致的错误重定向
- `src/app/learn/page.tsx` - 修复 hydration 导致的错误重定向
- `src/app/stats/page.tsx` - 修复 hydration mismatch（SSR/CSR 内容不匹配）
- `src/app/page.tsx` - 修复 hydration mismatch（首页统计数据）
- `src/app/profile/page.tsx` - 修复 hydration mismatch（个人中心设置数据）
- `docs/user-stories/learn-with-data.json` - 新增 11 个有数据场景的 User Story

**Bug 发现和修复:**
1. **Zustand persist hydration 竞态** - 页面加载时 `currentBookId` 初始为 null（persist 还未从 localStorage 恢复），useEffect 立即触发 redirect 到 /learn。修复：新增 `useStoreHydrated()` hook，在 hydration 完成前阻止 useEffect 执行。影响 6 个页面。
2. **Hydration mismatch** - stats、首页、个人中心页面在 SSR 时用初始空状态渲染，CSR hydrate 后值变化导致 React "Text content does not match" 错误。修复：在 hydration 完成前显示 loading spinner。影响 3 个页面。

**Docker 部署验证:**
- `docker compose up -d db` 启动 PostgreSQL 16 成功
- `npx prisma db push` 同步 schema 成功
- `npx prisma db seed` 导入 6 个词库（221 个单词）成功

**浏览器测试验证（全部通过）:**
- 词库列表页：6 个词库正确显示，包含单词数量和难度标签
- 词库详情页：50 个 CET-4 单词完整显示，设为当前词库功能正常
- 新词学习：翻转卡片 → 显示释义和例句 → 四级评分按钮 → 进入下一词
- 选择题：四选一 → 15 题 → 选择正确答案后自动进入下一题
- 拼写测试：显示中文释义 → 输入英文 → 正确提示和例句 → 下一个
- 复习模式：无到期单词时正确显示空状态和学习新词引导
- 统计页面：累计学习 2 词、100% 正确率、连续 1 天、日历和图表正常
- 首页仪表盘：今日新学 2/30、连续打卡 1 天、进度条正常
- 个人中心：设置修改（+5）、导出数据、开关切换功能正常

**Status:** Completed

**Notes:** 210 个单元测试全部通过，无回归。新增 11 个 User Story（有数据场景），累计 33 个。修复了 9 个文件的 hydration 问题。

---

## 2026-03-05 - 全页面浏览器验证 + 词库详情页分页修复

**Task:** 完整测试所有页面和按钮是否正常，发现并修复词库详情页大数据加载问题

**浏览器测试验证（16 个用例全部通过）:**
- 首页：欢迎回来、4个统计卡片（连续打卡1天、今日新学22/30、今日复习3/50、学习时长0分钟）、3个快捷入口
- 导航栏：5个导航链接（首页、词库、学习、统计、我的）全部正确跳转
- 主题切换：点击切换主题按钮正常响应
- 词库列表：6个词库完整显示（CET-4:4533、CET-6:2220、考研:5390、IELTS:8496、TOEFL:4510、GRE:4325）
- 词库详情：分页加载50个/页，GRE(4325词)秒级加载
- 学习中心：4种学习模式入口完整（新词999、复习0、拼写、选择题）
- 新词学习：翻转卡片 → 释义 → 四级评分 → 下一词
- 选择题：四选一 → 选择后锁定选项 → 反馈
- 拼写测试：中文释义 → 输入 → 拼写正确 → 下一个
- 复习模式：空状态提示 + 学习新词引导
- 统计页：累计22词、正确率72%、连续1天、图表区域
- 个人中心：新词/复习数量±、美式/英式发音切换、自动播放/音标开关、导出/清除数据
- 登录页：邮箱、密码、登录按钮、立即注册跳转
- 注册页：昵称、邮箱、密码、确认密码、注册按钮、立即登录跳转

**Bug 发现和修复:**
1. **词库详情页大数据超时** - GRE（4325词）等大词库详情页加载时页面空白，原因是 API 一次返回全部单词渲染到 DOM 导致超时。
   - 修复 API `src/app/api/words/[bookId]/route.ts`：添加分页参数（page/pageSize/search），默认每页50条，学习模式可用 `?all=true` 获取全部
   - 修复前端 `src/app/wordbooks/[bookId]/page.tsx`：添加分页 UI（上一页/下一页按钮）、搜索防抖、分页加载动画
   - 修复学习页 `src/app/learn/*.tsx` 和 `src/app/stats/page.tsx`：API 调用加 `?all=true` 保证获取全部单词

**Changes:**
- `src/app/api/words/[bookId]/route.ts` - 重写为支持分页、搜索、全量三种模式
- `src/app/wordbooks/[bookId]/page.tsx` - 重写为分页加载 + 搜索防抖 + 分页 UI
- `src/app/learn/page.tsx` - API 调用加 `?all=true`
- `src/app/learn/new/page.tsx` - API 调用加 `?all=true`
- `src/app/learn/review/page.tsx` - API 调用加 `?all=true`
- `src/app/learn/spell/page.tsx` - API 调用加 `?all=true`
- `src/app/learn/quiz/page.tsx` - API 调用加 `?all=true`
- `src/app/stats/page.tsx` - API 调用加 `?all=true`
- `docs/user-stories/full-page-test.json` - 新增 16 个全面页面测试 User Story

**Status:** Completed

**Notes:** 所有 16 个新 User Stories 验证通过，累计 49 个用例。词库详情页分页后 GRE(4325词) 从超时变为秒级加载。

---

## 2026-03-05 - 美式/英式发音切换功能完整测试

**Task:** 验证美式和英式发音切换功能在所有学习页面中正常工作

**代码审查确认:**
- `src/types/index.ts` - `PronunciationType = "en-US" | "en-GB"`，默认 `"en-US"`
- `src/app/profile/page.tsx` - 美式/英式切换按钮，调用 `updateSettings({ pronunciation: "en-US/en-GB" })`
- `src/components/word/flash-card.tsx` - 从 store 读取 pronunciation，设置 `utterance.lang`
- `src/components/word/quiz-card.tsx` - 同上
- `src/components/word/spell-card.tsx` - 同上
- `src/app/wordbooks/[bookId]/page.tsx` - 同上
- `src/lib/store.ts` - Zustand persist 持久化 settings 到 localStorage

**浏览器测试验证（5 个用例全部通过）:**
1. 个人中心：美式/英式按钮显示正确，点击切换响应正常
2. 新词学习页：切换英式后发音按钮正常调用 Web Speech API（en-GB）
3. 切回美式：发音恢复 en-US，发音按钮正常响应
4. 选择题/拼写测试：发音按钮遵循全局设置，无报错
5. 持久化：切换英式后刷新页面，设置通过 localStorage 保持

**Status:** Completed

**Notes:** 发音切换功能实现完整，覆盖所有 4 个使用发音的组件。新增 5 个 User Story，累计 54 个用例。

---

## 2026-03-05 - 发音引擎从 Web Speech API 切换为有道词典 TTS

**Task:** 解决美式/英式发音听起来一样的问题，改用有道词典 TTS API 提供真正不同的发音

**问题分析:**
Web Speech API 的 `en-US` 和 `en-GB` 在大多数系统上依赖系统安装的语音包，很多 Windows/Mac 系统只有一种英语语音，导致切换发音类型后听起来完全一样。

**解决方案:**
使用有道词典免费 TTS API，返回真实的人声录音 MP3：
- 美式: `https://dict.youdao.com/dictvoice?type=0&audio=word`
- 英式: `https://dict.youdao.com/dictvoice?type=1&audio=word`
- 无需 API Key，直接返回 MP3 音频
- 离线时自动回退到 Web Speech API

**Changes:**
- `src/lib/audio.ts` - 新建统一的发音工具模块，包含 `playWordAudio()` 和 `getAudioUrl()` 函数
- `src/components/word/flash-card.tsx` - 替换 Web Speech API 为有道 TTS
- `src/components/word/quiz-card.tsx` - 同上
- `src/components/word/spell-card.tsx` - 同上
- `src/app/wordbooks/[bookId]/page.tsx` - 同上
- `src/app/stats/page.tsx` - 同上
- `docs/user-stories/pronunciation-switch.json` - 更新为 6 个用例

**浏览器测试验证（全部通过）:**
- 有道 TTS API 可访问（返回 10KB+ MP3 音频）
- 美式发音按钮：请求 type=0，正常播放无报错
- 英式发音按钮：请求 type=1，正常播放无报错
- 拼写测试听发音提示：正常响应
- 选择题页面：正常加载和发音

**Status:** Completed

**Notes:** 5 个文件的 speechSynthesis 调用全部替换为有道 TTS。新建 audio.ts 工具模块统一管理发音逻辑，含回退机制。累计 55 个用例。

---
