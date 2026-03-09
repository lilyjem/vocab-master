/**
 * 成就解锁通知 Hook
 * 对比当前成就状态与已展示记录，返回待展示的新解锁成就列表
 * 支持两种场景：
 *   1. 学习完成时（enabled = isComplete）
 *   2. 回到仪表盘时（enabled = hydrated，补漏检查）
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLearningData } from "@/lib/use-learning-data";
import type { AchievementResult } from "@/lib/achievements";
import type { AchievementTier } from "@/types";

/** 等级优先级映射，用于对比等级高低 */
const TIER_ORDER: Record<AchievementTier, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
  star: 6,
  king: 7,
};

interface UseAchievementNotifierOptions {
  /** 是否启用检查（如 isComplete 变为 true 时传入 true） */
  enabled: boolean;
}

interface UseAchievementNotifierReturn {
  /** 当前正在展示的成就（队列第一个），null 表示没有待展示 */
  currentUnlock: AchievementResult | null;
  /** 关闭当前弹窗时调用：标记为已展示 + 弹出队列中的下一个 */
  dismissCurrent: () => void;
  /** 待展示的新解锁成就队列 */
  pendingUnlocks: AchievementResult[];
}

export function useAchievementNotifier({
  enabled,
}: UseAchievementNotifierOptions): UseAchievementNotifierReturn {
  const {
    hydrated,
    checkLocalAchievements,
    shownAchievementTiers,
    markAchievementShown,
  } = useLearningData();

  const [pendingUnlocks, setPendingUnlocks] = useState<AchievementResult[]>([]);
  /** 防止同一次 enabled=true 期间重复触发检查 */
  const checkedRef = useRef(false);

  // 当 enabled 从 false → true 时执行成就检查
  useEffect(() => {
    if (!enabled || !hydrated || checkedRef.current) return;
    checkedRef.current = true;

    const results = checkLocalAchievements();

    // 找出比已展示等级更高的成就（首次达成或升级）
    const newUnlocks = results.filter((r) => {
      if (r.tier === "none") return false;
      const shownTier = shownAchievementTiers[r.code] || "none";
      return TIER_ORDER[r.tier] > TIER_ORDER[shownTier];
    });

    if (newUnlocks.length > 0) {
      setPendingUnlocks(newUnlocks);
    }
  }, [enabled, hydrated, checkLocalAchievements, shownAchievementTiers]);

  // enabled 从 true → false 时重置，允许下次再检查
  useEffect(() => {
    if (!enabled) {
      checkedRef.current = false;
    }
  }, [enabled]);

  /** 关闭当前弹窗：标记当前成就为已展示，移出队列 */
  const dismissCurrent = useCallback(() => {
    setPendingUnlocks((prev) => {
      if (prev.length === 0) return prev;
      const current = prev[0];
      markAchievementShown(current.code, current.tier);
      return prev.slice(1);
    });
  }, [markAchievementShown]);

  const currentUnlock = pendingUnlocks.length > 0 ? pendingUnlocks[0] : null;

  return { currentUnlock, dismissCurrent, pendingUnlocks };
}
