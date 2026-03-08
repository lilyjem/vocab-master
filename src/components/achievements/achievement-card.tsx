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
};

// 等级颜色（铜/银/金）
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
    label: "铜",
    hex: "#CD7F32",
  },
  silver: {
    bg: "bg-gray-200 dark:bg-gray-700",
    text: "text-gray-600 dark:text-gray-300",
    label: "银",
    hex: "#C0C0C0",
  },
  gold: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-600 dark:text-yellow-400",
    label: "金",
    hex: "#FFD700",
  },
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
  const progressPercent =
    maxForCurrentTier > 0
      ? Math.min(100, Math.round((progress / maxForCurrentTier) * 100))
      : tier === "gold"
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
              indicatorClassName={
                tier === "gold"
                  ? "bg-yellow-500"
                  : tier === "silver"
                    ? "bg-gray-500"
                    : tier === "bronze"
                      ? "bg-amber-600"
                      : undefined
              }
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
