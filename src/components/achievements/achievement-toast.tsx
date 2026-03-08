/**
 * 成就解锁 Toast 通知组件
 * 无全局 toast 系统时使用：简单动画 div，自动消失
 */
"use client";

import { useState, useEffect } from "react";
import { Award } from "lucide-react";
import type { AchievementTier } from "@/types";

const TIER_LABELS: Record<Exclude<AchievementTier, "none">, string> = {
  bronze: "铜牌",
  silver: "银牌",
  gold: "金牌",
};

const TIER_COLORS: Record<Exclude<AchievementTier, "none">, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
};

export interface AchievementToastProps {
  /** 成就名称 */
  name: string;
  /** 成就等级 */
  tier: Exclude<AchievementTier, "none">;
  /** 自动消失延迟（毫秒），默认 4000 */
  duration?: number;
  /** 关闭回调 */
  onClose?: () => void;
}

export function AchievementToast({
  name,
  tier,
  duration = 4000,
  onClose,
}: AchievementToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const label = TIER_LABELS[tier];
  const color = TIER_COLORS[tier];

  return (
    <div
      role="alert"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="flex items-center gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: color + "30" }}
        >
          <Award className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-medium">🎉 解锁新成就</p>
          <p className="text-xs text-muted-foreground">
            {name} · {label}
          </p>
        </div>
      </div>
    </div>
  );
}
