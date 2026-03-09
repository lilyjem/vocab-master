# 成就解锁全屏庆祝通知 — 设计文档

## 日期
2026-03-09

## 目标
当用户解锁成就新等级时，弹出全屏庆祝弹窗，增强仪式感和激励效果。

## 现状
- 已有 `AchievementToast` 组件但从未被使用
- 已有 `findNewUnlocks()` 函数可对比新旧成就
- 服务端 API `/api/achievements` 已返回 `newUnlocks` 字段
- 缺失：学习行为 → 成就检查 → 通知展示 的完整链路

## 方案选择
使用 `canvas-confetti` 库（~6KB gzipped）+ CSS 动画实现全屏庆祝效果。

## 触发时机（双重保障）

1. **学习完成时**：4 个学习模式（new/review/spell/quiz）完成后触发成就检查
2. **回到仪表盘时**：Dashboard 挂载时补检查，处理"学到一半退出"的情况

## 防重复机制

- Zustand store 增加 `shownAchievementTiers: Record<string, AchievementTier>`
- 记录每个成就已展示过的最高等级
- 弹窗关闭后更新 `shownAchievementTiers`
- 持久化到 localStorage

## 全屏庆祝组件 `AchievementCelebration`

### 视觉效果
- 全屏半透明黑色遮罩 + backdrop-blur
- 中央成就卡片从小到大弹出（scale 动画）
- 等级对应颜色的光晕效果
- canvas-confetti 五彩纸屑爆炸（从两侧喷射）
- 段位图标 + 段位名称 + 成就名称
- 底部按钮关闭
- 多个成就排队展示

## 文件结构

| 文件 | 作用 |
|------|------|
| `src/components/achievements/achievement-celebration.tsx` | 全屏庆祝弹窗（新增） |
| `src/hooks/use-achievement-notifier.ts` | 成就对比 hook（新增） |
| `src/lib/store.ts` | 增加 shownAchievementTiers + markAchievementShown |
| `src/lib/use-server-data.ts` | 同步增加 shownAchievementTiers 支持 |
| `src/lib/use-learning-data.ts` | 统一接口暴露 |
| `src/app/learn/new/page.tsx` | 完成时调用 hook |
| `src/app/learn/review/page.tsx` | 完成时调用 hook |
| `src/app/learn/spell/page.tsx` | 完成时调用 hook |
| `src/app/learn/quiz/page.tsx` | 完成时调用 hook |
| `src/components/dashboard/dashboard.tsx` | 挂载时补检查 |

## 数据流

```
用户完成学习 → checkLocalAchievements()
                    ↓
         对比 shownAchievementTiers（而非上次 check 结果）
                    ↓
         如有新解锁 → AchievementCelebration 弹窗
                    ↓
         用户关闭 → markAchievementShown() 更新记录
```
