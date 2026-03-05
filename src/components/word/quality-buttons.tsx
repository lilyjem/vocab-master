/**
 * SM-2 评分按钮组件
 * 用户翻转卡片后，选择对该单词的掌握程度
 */
"use client";

import { QUALITY_LABELS } from "@/lib/sm2";
import { cn } from "@/lib/utils";

interface QualityButtonsProps {
  onRate: (quality: number) => void;
  simplified?: boolean; // 简化模式（只显示4个选项）
}

export function QualityButtons({ onRate, simplified = false }: QualityButtonsProps) {
  /** 简化模式的评分映射: 忘记(1)、模糊(3)、记住(4)、熟悉(5) */
  const simplifiedOptions = [
    { quality: 1, label: "不认识", color: "bg-red-500 hover:bg-red-600", textColor: "text-white" },
    { quality: 3, label: "模糊", color: "bg-amber-500 hover:bg-amber-600", textColor: "text-white" },
    { quality: 4, label: "记住了", color: "bg-blue-500 hover:bg-blue-600", textColor: "text-white" },
    { quality: 5, label: "很熟悉", color: "bg-green-500 hover:bg-green-600", textColor: "text-white" },
  ];

  if (simplified) {
    return (
      <div className="flex gap-2 w-full max-w-lg mx-auto">
        {simplifiedOptions.map((opt) => (
          <button
            key={opt.quality}
            onClick={() => onRate(opt.quality)}
            className={cn(
              "flex-1 rounded-xl py-3 px-2 font-medium text-sm transition-all active:scale-95",
              opt.color,
              opt.textColor
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-lg mx-auto sm:grid-cols-6">
      {Object.entries(QUALITY_LABELS).map(([key, { label, color, description }]) => (
        <button
          key={key}
          onClick={() => onRate(Number(key))}
          className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 transition-all hover:shadow-md active:scale-95"
          title={description}
        >
          <div
            className="h-2 w-8 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
