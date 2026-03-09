# 成就解锁全屏庆祝通知 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 当用户解锁成就新等级时，弹出全屏庆祝弹窗（canvas-confetti 粒子 + 段位升级动画），触发点为学习完成时和回到仪表盘时（双重保障）。

**Architecture:** 新增 `shownAchievementTiers` 状态到 Zustand store 做防重复，新建 `useAchievementNotifier` hook 封装对比逻辑，新建 `AchievementCelebration` 全屏组件。4 个学习页面和 Dashboard 分别在完成/挂载时调用 hook。

**Tech Stack:** React, Zustand, canvas-confetti, Tailwind CSS, CSS Animations

---

### Task 1: 安装 canvas-confetti

**Step 1: 安装依赖**

Run: `npm install canvas-confetti`
Run: `npm install -D @types/canvas-confetti`

**Step 2: 验证安装**

Run: `npm ls canvas-confetti`
Expected: canvas-confetti@x.x.x

**Step 3: Commit**

```
git add package.json package-lock.json
git commit -m "chore: 安装 canvas-confetti 依赖"
```

---

### Task 2: Zustand store 增加 shownAchievementTiers

**Files:**
- Modify: `src/lib/store.ts` — LearningStore 接口和实现
- Modify: `src/types/index.ts` — 如需新类型

**Step 1: 在 LearningStore 接口中增加字段和方法**

在 `src/lib/store.ts` 的 `LearningStore` 接口中，在 `checkLocalAchievements` 后面加：

```typescript
// 已展示过的成就最高等级（防重复弹窗）
shownAchievementTiers: Record<string, AchievementTier>;
markAchievementShown: (code: string, tier: AchievementTier) => void;
```

需要在文件顶部 import `AchievementTier`：
```typescript
import type { AchievementTier } from "@/types";
```

**Step 2: 在 store 实现中初始化和实现**

在 `persist` 内的初始状态中加：
```typescript
shownAchievementTiers: {},
```

在方法实现中加：
```typescript
markAchievementShown: (code, tier) => {
  set((state) => ({
    shownAchievementTiers: {
      ...state.shownAchievementTiers,
      [code]: tier,
    },
  }));
},
```

**Step 3: 验证类型正确**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: 无错误或仅无关警告

**Step 4: Commit**

```
git add src/lib/store.ts
git commit -m "feat: store 增加 shownAchievementTiers 防重复弹窗状态"
```

---

### Task 3: use-server-data 和 use-learning-data 增加同步支持

**Files:**
- Modify: `src/lib/use-server-data.ts`
- Modify: `src/lib/use-learning-data.ts`

**Step 1: use-server-data.ts 增加 shownAchievementTiers 和 markAchievementShown**

在 `ServerDataInterface` 接口中加：
```typescript
shownAchievementTiers: Record<string, AchievementTier>;
markAchievementShown: (code: string, tier: AchievementTier) => void;
```

在实现中，服务端用户复用本地 store 的 `shownAchievementTiers`（因为这是 UI 层状态，不需要存服务器）：
```typescript
import { useLearningStore } from "@/lib/store";

// 在 hook 内部
const localShownTiers = useLearningStore((s) => s.shownAchievementTiers);
const localMarkShown = useLearningStore((s) => s.markAchievementShown);
```

返回值中加：
```typescript
shownAchievementTiers: localShownTiers,
markAchievementShown: localMarkShown,
```

**Step 2: use-learning-data.ts 的 LearningDataInterface 中增加**

```typescript
shownAchievementTiers: Record<string, AchievementTier>;
markAchievementShown: (code: string, tier: AchievementTier) => void;
```

在两个返回路径（isAuthenticated 和本地）都传递这两个字段。

**Step 3: 验证类型正确**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 4: Commit**

```
git add src/lib/use-server-data.ts src/lib/use-learning-data.ts
git commit -m "feat: 统一接口暴露 shownAchievementTiers"
```

---

### Task 4: 创建 useAchievementNotifier hook

**Files:**
- Create: `src/hooks/use-achievement-notifier.ts`

**Step 1: 创建 hook 文件**

```typescript
/**
 * 成就解锁通知 Hook
 * 对比当前成就状态与已展示记录，返回待展示的新解锁成就列表
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLearningData } from "@/lib/use-learning-data";
import type { AchievementResult } from "@/lib/achievements";
import type { AchievementTier } from "@/types";

// 等级优先级映射，用于对比等级高低
const TIER_ORDER: Record<AchievementTier, number> = {
  none: 0, bronze: 1, silver: 2, gold: 3,
  platinum: 4, diamond: 5, star: 6, king: 7,
};

interface UseAchievementNotifierOptions {
  /** 是否启用检查（如在 isComplete 变为 true 时传入 true） */
  enabled: boolean;
}

interface UseAchievementNotifierReturn {
  /** 待展示的新解锁成就队列 */
  pendingUnlocks: AchievementResult[];
  /** 关闭当前弹窗时调用，标记为已展示并弹出队列中的下一个 */
  dismissCurrent: () => void;
  /** 当前正在展示的成就（队列第一个） */
  currentUnlock: AchievementResult | null;
}

export function useAchievementNotifier(
  { enabled }: UseAchievementNotifierOptions
): UseAchievementNotifierReturn {
  const {
    hydrated,
    checkLocalAchievements,
    shownAchievementTiers,
    markAchievementShown,
  } = useLearningData();

  const [pendingUnlocks, setPendingUnlocks] = useState<AchievementResult[]>([]);
  // 防止重复触发检查
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !hydrated || checkedRef.current) return;
    checkedRef.current = true;

    const results = checkLocalAchievements();

    // 找出比已展示等级更高的成就
    const newUnlocks = results.filter((r) => {
      if (r.tier === "none") return false;
      const shownTier = shownAchievementTiers[r.code] || "none";
      return TIER_ORDER[r.tier] > TIER_ORDER[shownTier];
    });

    if (newUnlocks.length > 0) {
      setPendingUnlocks(newUnlocks);
    }
  }, [enabled, hydrated, checkLocalAchievements, shownAchievementTiers]);

  // 重置 checkedRef（当 enabled 从 false 变为 true 时允许再次检查）
  useEffect(() => {
    if (!enabled) {
      checkedRef.current = false;
    }
  }, [enabled]);

  const dismissCurrent = useCallback(() => {
    setPendingUnlocks((prev) => {
      if (prev.length === 0) return prev;
      // 标记第一个为已展示
      const current = prev[0];
      markAchievementShown(current.code, current.tier);
      return prev.slice(1);
    });
  }, [markAchievementShown]);

  const currentUnlock = pendingUnlocks.length > 0 ? pendingUnlocks[0] : null;

  return { pendingUnlocks, dismissCurrent, currentUnlock };
}
```

**Step 2: 验证类型**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```
git add src/hooks/use-achievement-notifier.ts
git commit -m "feat: 创建 useAchievementNotifier hook"
```

---

### Task 5: 创建 AchievementCelebration 全屏庆祝组件

**Files:**
- Create: `src/components/achievements/achievement-celebration.tsx`

**Step 1: 创建组件**

组件需要：
- 全屏遮罩（fixed inset-0, bg-black/60, backdrop-blur, z-[100]）
- 中央卡片（scale 弹入动画）
- 等级颜色光晕
- canvas-confetti 从两侧喷射
- 段位图标 + 等级名 + 成就名
- "太棒了！" 关闭按钮
- 支持 `achievement: AchievementResult` 和 `onClose: () => void` props

等级颜色和名称映射复用现有的 TIER_COLORS/TIER_LABELS 模式。

canvas-confetti 调用逻辑：
```typescript
import confetti from "canvas-confetti";

// 组件挂载时触发
useEffect(() => {
  // 左侧喷射
  confetti({ particleCount: 80, spread: 70, origin: { x: 0.1, y: 0.6 }, colors: [tierHexColor, "#FFD700", "#FFA500"] });
  // 右侧喷射
  confetti({ particleCount: 80, spread: 70, origin: { x: 0.9, y: 0.6 }, colors: [tierHexColor, "#FFD700", "#FFA500"] });
  // 延迟后中央再来一波
  setTimeout(() => {
    confetti({ particleCount: 50, spread: 100, origin: { x: 0.5, y: 0.4 } });
  }, 300);
}, []);
```

**Step 2: 验证类型和构建**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```
git add src/components/achievements/achievement-celebration.tsx
git commit -m "feat: 创建全屏庆祝弹窗组件"
```

---

### Task 6: 在 4 个学习页面集成

**Files:**
- Modify: `src/app/learn/new/page.tsx`
- Modify: `src/app/learn/review/page.tsx`
- Modify: `src/app/learn/spell/page.tsx`
- Modify: `src/app/learn/quiz/page.tsx`

**Step 1: 每个页面中添加 hook 和组件**

在每个页面中：

1. Import:
```typescript
import { useAchievementNotifier } from "@/hooks/use-achievement-notifier";
import { AchievementCelebration } from "@/components/achievements/achievement-celebration";
```

2. 在组件内，`isComplete` 状态之后添加：
```typescript
const { currentUnlock, dismissCurrent } = useAchievementNotifier({ enabled: isComplete });
```

3. 在完成界面 JSX 中（`isComplete` 条件渲染块内），最外层添加：
```tsx
{currentUnlock && (
  <AchievementCelebration
    achievement={currentUnlock}
    onClose={dismissCurrent}
  />
)}
```

**Step 2: 验证类型和构建**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```
git add src/app/learn/
git commit -m "feat: 4 个学习页面集成成就庆祝通知"
```

---

### Task 7: 在 Dashboard 集成（补漏检查）

**Files:**
- Modify: `src/components/dashboard/dashboard.tsx`

**Step 1: 添加 hook 和组件**

Dashboard 始终 enabled（`{ enabled: hydrated }`），因为用户可能学到一半退出后回到首页。

```typescript
import { useAchievementNotifier } from "@/hooks/use-achievement-notifier";
import { AchievementCelebration } from "@/components/achievements/achievement-celebration";

// 在 Dashboard 组件内
const { currentUnlock, dismissCurrent } = useAchievementNotifier({ enabled: hydrated });
```

在 JSX 最外层加：
```tsx
{currentUnlock && (
  <AchievementCelebration
    achievement={currentUnlock}
    onClose={dismissCurrent}
  />
)}
```

**Step 2: 验证构建**

Run: `npx tsc --noEmit 2>&1 | head -20`
Run: `npm run build`

**Step 3: Commit**

```
git add src/components/dashboard/dashboard.tsx
git commit -m "feat: Dashboard 集成成就庆祝通知（补漏检查）"
```

---

### Task 8: 端到端验证

**Step 1: 本地启动开发服务器**

Run: `npm run dev`

**Step 2: 手动测试**

1. 打开应用，学习几个新词直到完成一轮
2. 如果触发了成就（如词汇新手·青铜），验证全屏庆祝弹窗出现
3. 关闭弹窗，验证不再重复弹出
4. 回到首页，验证 Dashboard 不重复弹同一个成就
5. 学到一半退出，回到首页，验证补弹

**Step 3: Final commit**

```
git add .
git commit -m "feat: 成就解锁全屏庆祝通知 — 完整实现"
```
