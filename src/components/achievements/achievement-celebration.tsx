/**
 * 成就解锁全屏庆祝组件
 * 全屏遮罩 + 段位卡片弹入动画 + canvas-confetti 粒子爆炸
 * 支持多个成就排队展示（由 useAchievementNotifier 控制队列）
 */
"use client";

import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AchievementResult } from "@/lib/achievements";
import type { AchievementTier } from "@/types";

/** 等级名称映射（中文段位名） */
const TIER_LABELS: Record<Exclude<AchievementTier, "none">, string> = {
  bronze: "倔强青铜",
  silver: "秩序白银",
  gold: "荣耀黄金",
  platinum: "尊贵铂金",
  diamond: "永恒钻石",
  star: "至尊星耀",
  king: "最强王者",
};

/** 等级主色（hex，用于粒子颜色和光晕） */
const TIER_HEX: Record<Exclude<AchievementTier, "none">, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#00CED1",
  diamond: "#87CEEB",
  star: "#9b59b6",
  king: "#ff4500",
};

/** 等级渐变背景（卡片光晕效果） */
const TIER_GLOW: Record<Exclude<AchievementTier, "none">, string> = {
  bronze: "shadow-[0_0_60px_rgba(205,127,50,0.4)]",
  silver: "shadow-[0_0_60px_rgba(192,192,192,0.4)]",
  gold: "shadow-[0_0_60px_rgba(255,215,0,0.5)]",
  platinum: "shadow-[0_0_60px_rgba(0,206,209,0.4)]",
  diamond: "shadow-[0_0_80px_rgba(135,206,235,0.5)]",
  star: "shadow-[0_0_80px_rgba(155,89,182,0.5)]",
  king: "shadow-[0_0_100px_rgba(255,69,0,0.6)]",
};

/** 等级边框颜色 */
const TIER_BORDER: Record<Exclude<AchievementTier, "none">, string> = {
  bronze: "border-amber-600/50",
  silver: "border-gray-400/50",
  gold: "border-yellow-500/50",
  platinum: "border-teal-400/50",
  diamond: "border-sky-300/50",
  star: "border-purple-400/50",
  king: "border-orange-500/50",
};

interface AchievementCelebrationProps {
  /** 成就数据 */
  achievement: AchievementResult;
  /** 关闭回调（标记为已展示 + 弹出下一个） */
  onClose: () => void;
}

export function AchievementCelebration({
  achievement,
  onClose,
}: AchievementCelebrationProps) {
  const tier = achievement.tier as Exclude<AchievementTier, "none">;
  const hexColor = TIER_HEX[tier];

  /** 触发 confetti 粒子爆炸 */
  const fireConfetti = useCallback(() => {
    const colors = [hexColor, "#FFD700", "#FFA500", "#ffffff"];

    // 左侧喷射
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.15, y: 0.6 },
      colors,
      zIndex: 200,
    });

    // 右侧喷射
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.85, y: 0.6 },
      colors,
      zIndex: 200,
    });

    // 延迟后中央追加一波
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        colors,
        zIndex: 200,
      });
    }, 300);
  }, [hexColor]);

  // 组件挂载时触发粒子
  useEffect(() => {
    fireConfetti();
  }, [fireConfetti]);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* 中央庆祝卡片 */}
      <div
        className={`
          relative flex flex-col items-center gap-4 rounded-2xl border-2
          bg-background/95 px-8 py-10 backdrop-blur-md
          animate-in zoom-in-75 duration-500
          ${TIER_GLOW[tier]} ${TIER_BORDER[tier]}
        `}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "340px" }}
      >
        {/* 段位图标（大圆 + 光晕） */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: `radial-gradient(circle, ${hexColor}30 0%, transparent 70%)`,
            boxShadow: `0 0 40px ${hexColor}40`,
          }}
        >
          <Award className="h-10 w-10" style={{ color: hexColor }} />
        </div>

        {/* 庆祝文案 */}
        <p className="text-lg font-bold tracking-wide">🎉 成就解锁</p>

        {/* 成就名称 */}
        <p className="text-xl font-bold" style={{ color: hexColor }}>
          {achievement.name}
        </p>

        {/* 段位标签 */}
        <div
          className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
          style={{ backgroundColor: hexColor }}
        >
          {TIER_LABELS[tier]}
        </div>

        {/* 进度说明 */}
        <p className="text-sm text-muted-foreground">
          当前进度: {achievement.progress} / {achievement.maxForCurrentTier}
        </p>

        {/* 关闭按钮 */}
        <Button
          className="mt-2 w-full"
          onClick={onClose}
          style={{
            backgroundColor: hexColor,
            color: "#fff",
          }}
        >
          太棒了！
        </Button>
      </div>
    </div>
  );
}
