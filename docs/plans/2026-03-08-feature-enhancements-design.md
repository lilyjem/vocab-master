# VocabMaster 功能增强设计文档

**日期:** 2026-03-08
**作者:** Jem + AI
**状态:** 已批准

---

## 概述

为 VocabMaster 英语词汇学习平台添加 5 项功能增强，按优先级排序：

1. **全面性能优化** - 虚拟列表、API 缓存、首屏加载优化
2. **智能学习顺序（词频优先）** - 为单词添加词频数据，高频词先学
3. **成就系统（分级徽章）** - 铜/银/金三级成就，8 个成就类别
4. **例句上下文学习** - 实时从外部词典 API 获取多个例句
5. **词根词缀分析** - 从外部词典 API 获取词源信息

---

## 1. 全面性能优化

### 1A. 词书详情页 - 虚拟列表

- 引入 `@tanstack/react-virtual` 实现虚拟滚动
- 大词书（GRE 8000+ 词）只渲染可视区域内的词条
- 保留搜索和分页功能

### 1B. API 响应缓存

- 词书列表和单词数据使用 Next.js `unstable_cache` 或内存缓存
- 静态数据设置长缓存时间
- 用户相关数据使用短缓存 + 失效策略

### 1C. 首屏加载优化

- 分析 bundle 大小，按路由做代码分割
- 图表库（Recharts）懒加载
- 使用 `next/dynamic` 延迟加载非关键组件
- 优化字体加载策略

---

## 2. 智能学习顺序 - 词频优先

### 数据模型变更

- `Word` 模型新增 `frequency Int @default(0)` 字段
- 词频数据来源：COCA/BNC 公开词频表

### 行为变更

- 新词学习按 `frequency DESC` 排序（高频词先学）
- 复习词仍按 SM-2 的 `nextReviewDate` 排序
- 词书详情页支持按词频排序查看

---

## 3. 成就系统 - 分级徽章

### 数据模型

```
Achievement {
  id, code, name, description, category,
  bronzeThreshold, silverThreshold, goldThreshold, icon
}

UserAchievement {
  id, userId, achievementId, tier (bronze/silver/gold),
  currentProgress, unlockedAt, notified
}
```

### 成就类别（8 个）

| 成就名 | 铜 | 银 | 金 |
|--------|-----|-----|-----|
| 词汇新手 | 学习 50 词 | 学习 500 词 | 学习 2000 词 |
| 坚持不懈 | 连续打卡 3 天 | 连续打卡 14 天 | 连续打卡 30 天 |
| 复习达人 | 复习 100 次 | 复习 500 次 | 复习 2000 次 |
| 精准射手 | 单次测验 80%+ | 单次测验 95%+ | 连续 10 次 95%+ |
| 拼写高手 | 拼写正确 50 词 | 拼写正确 200 词 | 拼写正确 500 词 |
| 词书征服者 | 完成 1 本词书 | 完成 3 本词书 | 完成全部词书 |
| 学习时长 | 累计 1 小时 | 累计 10 小时 | 累计 50 小时 |
| 早起鸟 | 6-8 点学习 5 次 | 6-8 点学习 20 次 | 6-8 点学习 50 次 |

### 前端

- 个人资料页新增"成就"标签页
- 成就卡片展示当前进度和等级
- 解锁新成就时弹出 toast 通知
- 主页仪表盘展示最近解锁的成就

---

## 4. 例句上下文学习

### 架构

- 新增后端 API 路由 `/api/words/examples?word=xxx`
- 外部 API：Free Dictionary API (dictionaryapi.dev) 为主，有道词典为备选
- 后端缓存已查询过的例句（数据库 `WordExample` 模型）
- 前端在 FlashCard / QuizCard 等组件中添加"例句"展开区域
- 支持例句中高亮目标单词

### 数据流

用户点击"查看例句" → 前端请求 `/api/words/examples` → 后端检查缓存 → 未命中则调用外部 API → 返回例句列表 → 前端渲染

---

## 5. 词根词缀分析

### 架构

- 新增后端 API 路由 `/api/words/etymology?word=xxx`
- 外部 API：Free Dictionary API 的词源字段 / Wiktionary API
- 数据库新增 `WordEtymology` 模型缓存已查询的词源数据
- 前端在卡片中增加"词根分析"展开区域
- 展示格式：`un- (否定) + break (打破) + -able (可...的)` = unbreakable

### 数据模型

```
WordEtymology {
  id, wordText, roots (JSON), prefixes (JSON), suffixes (JSON),
  origin, relatedWords (JSON), fetchedAt
}
```
