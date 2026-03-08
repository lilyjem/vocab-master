/**
 * 学习页面快捷键 Hook
 * 提供统一的键盘快捷键支持，避免在各页面重复绑定逻辑。
 *
 * 快捷键方案：
 * - 空格：翻转卡片
 * - 1-5：评分（简化模式映射为 1→1, 2→3, 3→4, 4→5）
 * - →：下一个
 * - ←：上一个（如果支持）
 * - Esc：返回上一页
 * - Enter：提交答案（拼写/测验）
 * - Tab：跳过（拼写/测验）
 */
"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseCardShortcutsOptions {
  /** 翻转卡片 */
  onFlip?: () => void;
  /** 评分回调（quality: 1-5） */
  onRate?: (quality: number) => void;
  /** 是否已翻转（翻转后才允许评分） */
  isFlipped?: boolean;
  /** 是否已完成（完成后禁用快捷键） */
  isComplete?: boolean;
  /** 是否使用简化评分（4 个按钮：1→1, 2→3, 3→4, 4→5） */
  simplified?: boolean;
}

/**
 * 卡片学习页快捷键（new / review）
 */
export function useCardShortcuts({
  onFlip,
  onRate,
  isFlipped = false,
  isComplete = false,
  simplified = true,
}: UseCardShortcutsOptions) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 输入框中不触发快捷键
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (isComplete) return;

      switch (e.key) {
        case " ": {
          // 空格翻转卡片
          e.preventDefault();
          onFlip?.();
          break;
        }
        case "1":
        case "2":
        case "3":
        case "4":
        case "5": {
          // 数字键评分（仅翻转后有效）
          if (!isFlipped || !onRate) break;
          e.preventDefault();
          if (simplified) {
            // 简化模式：1→不认识(1), 2→模糊(3), 3→记住(4), 4→很熟悉(5)
            const map: Record<string, number> = { "1": 1, "2": 3, "3": 4, "4": 5 };
            if (map[e.key]) onRate(map[e.key]);
          } else {
            onRate(Number(e.key));
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          router.push("/learn");
          break;
        }
      }
    },
    [onFlip, onRate, isFlipped, isComplete, simplified, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

interface UseQuizShortcutsOptions {
  /** 提交答案 */
  onSubmit?: () => void;
  /** 跳过 */
  onSkip?: () => void;
  /** 是否已完成 */
  isComplete?: boolean;
}

/**
 * 拼写/测验页快捷键（spell / quiz）
 */
export function useQuizShortcuts({
  onSubmit,
  onSkip,
  isComplete = false,
}: UseQuizShortcutsOptions) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isComplete) return;

      switch (e.key) {
        case "Escape": {
          e.preventDefault();
          router.push("/learn");
          break;
        }
        case "Tab": {
          // Tab 跳过（仅非输入框焦点时，或由页面自行处理）
          const tag = (e.target as HTMLElement)?.tagName;
          if (tag === "INPUT" || tag === "TEXTAREA") return;
          e.preventDefault();
          onSkip?.();
          break;
        }
      }
      // Enter 提交由 input 的 onKeyDown 或 form 的 onSubmit 处理，不在此拦截
    },
    [isComplete, onSkip, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
