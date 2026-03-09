# 成就等级体系升级设计

## 概述

将成就等级从 3 级（铜/银/金）扩展为 7 级（参考王者荣耀段位体系），增加进阶感和挑战性。

## 等级体系

| 等级 | 名称 | 英文 Key | 颜色 | 颜色值 |
|------|------|----------|------|--------|
| 1 | 倔强青铜 | bronze | 铜色 | #cd7f32 |
| 2 | 秩序白银 | silver | 银色 | #c0c0c0 |
| 3 | 荣耀黄金 | gold | 金色 | #ffd700 |
| 4 | 尊贵铂金 | platinum | 青绿 | #00CED1 |
| 5 | 永恒钻石 | diamond | 钻石蓝 | #b9f2ff |
| 6 | 至尊星耀 | star | 紫色 | #9b59b6 |
| 7 | 最强王者 | king | 橙红 | #ff4500 |

## 12 个成就的 7 级门槛

| 成就 | 青铜 | 白银 | 黄金 | 铂金 | 钻石 | 星耀 | 王者 |
|------|------|------|------|------|------|------|------|
| vocab_learner 词汇新手 | 50 | 200 | 500 | 1000 | 2000 | 3500 | 5000 |
| streak_master 坚持不懈 | 3 | 7 | 14 | 30 | 60 | 120 | 365 |
| review_expert 复习达人 | 50 | 200 | 500 | 1000 | 2000 | 5000 | 10000 |
| accuracy_star 精准射手 | 60 | 70 | 80 | 85 | 90 | 95 | 100 |
| spell_master 拼写高手 | 30 | 100 | 200 | 500 | 1000 | 2000 | 5000 |
| book_conqueror 词书征服者 | 1 | 2 | 3 | 5 | 8 | 12 | 20 |
| study_timer 学习时长 | 30 | 120 | 300 | 600 | 1500 | 3000 | 6000 |
| early_bird 早起鸟 | 3 | 10 | 20 | 50 | 100 | 200 | 365 |
| night_owl 夜猫子 | 3 | 10 | 20 | 50 | 100 | 200 | 365 |
| weekend_warrior 周末战士 | 3 | 10 | 20 | 50 | 100 | 200 | 365 |
| word_slayer 百词斩 | 1 | 3 | 7 | 15 | 30 | 60 | 100 |
| marathon 马拉松 | 1 | 3 | 7 | 15 | 30 | 60 | 100 |

## 影响范围

### 后端
- `src/types/index.ts` - AchievementTier 类型扩展
- `src/lib/achievements.ts` - 等级定义和计算逻辑
- `prisma/schema.prisma` - Achievement 模型 tier 字段
- `prisma/seed/achievements.ts` - 种子数据更新
- `src/app/api/achievements/route.ts` - API 层（如有影响）

### 前端
- 成就展示组件 - 颜色、图标、进度条适配 7 级

### 数据库
- 已有 UserAchievement 记录的 tier 值需兼容（bronze/silver/gold 保持不变）
- 新增 platinum/diamond/star/king 值
