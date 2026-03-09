/**
 * 成就卡片组件 - 展示单个成就的图标、名称、等级、进度
 */
"use client";

import {
  BookOpen,
  Flame,
  Target,
  Award,
  PenTool,
  Trophy,
  Clock,
  Sunrise,
  Moon,
  Calendar,
  Zap,
  Timer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AchievementTier } from "@/types";

// 图标映射：成就 icon 字段 → lucide-react 组件
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Flame,
  Target,
  Award,
  PenTool,
  Trophy,
  Clock,
  Sunrise,
  Moon,
  Calendar,
  Zap,
  Timer,
};

// 等级颜色（7 级：青铜→白银→黄金→铂金→钻石→星耀→王者）
const TIER_COLORS: Record<
  AchievementTier,
  { bg: string; text: string; label: string; hex: string }
> = {
  none: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-400",
    label: "未解锁",
    hex: "#9ca3af",
  },
  bronze: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    label: "青铜",
    hex: "#CD7F32",
  },
  silver: {
    bg: "bg-gray-200 dark:bg-gray-700",
    text: "text-gray-600 dark:text-gray-300",
    label: "白银",
    hex: "#C0C0C0",
  },
  gold: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-600 dark:text-yellow-400",
    label: "黄金",
    hex: "#FFD700",
  },
  platinum: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-600 dark:text-teal-400",
    label: "铂金",
    hex: "#00CED1",
  },
  diamond: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-500 dark:text-sky-300",
    label: "钻石",
    hex: "#b9f2ff",
  },
  star: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
    label: "星耀",
    hex: "#9b59b6",
  },
  king: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-400",
    label: "王者",
    hex: "#ff4500",
  },
};

// 进度条颜色（按等级）
const PROGRESS_BAR_COLORS: Record<AchievementTier, string | undefined> = {
  none: undefined,
  bronze: "bg-amber-600",
  silver: "bg-gray-500",
  gold: "bg-yellow-500",
  platinum: "bg-teal-500",
  diamond: "bg-sky-400",
  star: "bg-purple-500",
  king: "bg-orange-500",
};

export interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  progress: number;
  maxForCurrentTier: number;
}

export function AchievementCard({
  name,
  description,
  icon,
  tier,
  progress,
  maxForCurrentTier,
}: AchievementCardProps) {
  const IconComponent = ICON_MAP[icon] ?? BookOpen;
  const tierStyle = TIER_COLORS[tier];
  const isMaxTier = tier === "king";
  const progressPercent =
    maxForCurrentTier > 0
      ? Math.min(100, Math.round((progress / maxForCurrentTier) * 100))
      : isMaxTier
        ? 100
        : 0;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${tierStyle.bg}`}
        >
          <IconComponent className={`h-6 w-6 ${tierStyle.text}`} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{name}</span>
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: tierStyle.hex + "40",
                color: tier === "none" ? undefined : tierStyle.hex,
              }}
            >
              {tierStyle.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center gap-3">
            <Progress
              value={progressPercent}
              className="h-1.5 flex-1"
              indicatorClassName={PROGRESS_BAR_COLORS[tier]}
            />
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {progress}/{maxForCurrentTier}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
