/**
 * 密码强度指示器组件
 * 根据密码复杂度实时显示强度等级（弱/中/强）
 */
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

/** 计算密码强度分数（0-4） */
function calculateStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(4, score);
}

const STRENGTH_CONFIG = [
  { label: "", color: "", width: "w-0" },
  { label: "弱", color: "bg-red-500", width: "w-1/4" },
  { label: "较弱", color: "bg-orange-500", width: "w-2/4" },
  { label: "中等", color: "bg-yellow-500", width: "w-3/4" },
  { label: "强", color: "bg-green-500", width: "w-full" },
];

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);
  const config = STRENGTH_CONFIG[strength];

  if (!password) return null;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            config.color,
            config.width
          )}
        />
      </div>
      <p
        className={cn("text-xs", {
          "text-red-500": strength <= 1,
          "text-orange-500": strength === 2,
          "text-yellow-600": strength === 3,
          "text-green-500": strength === 4,
        })}
      >
        密码强度：{config.label}
      </p>
    </div>
  );
}
