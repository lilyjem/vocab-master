/**
 * Zustand 本地状态管理
 * 为未登录用户提供 localStorage 持久化存储
 */
"use client";

import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LocalWordProgress,
  LocalSession,
  LocalDailyStats,
  UserSettings,
  WordStatus,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { calculateSM2, getWordStatus, SM2_DEFAULTS } from "@/lib/sm2";
import { formatDate, getToday } from "@/lib/utils";
import { pushSingleWord, pushDailyStats } from "@/lib/sync";

/** 本地学习数据 Store 接口 */
interface LearningStore {
  // ===== 状态 =====
  currentBookId: string | null;
  wordProgress: Record<string, LocalWordProgress>;
  sessions: LocalSession[];
  dailyStats: Record<string, LocalDailyStats>;
  settings: UserSettings;

  // ===== 词库选择 =====
  setCurrentBook: (bookId: string) => void;

  // ===== 单词学习 =====
  getWordProgress: (wordId: string) => LocalWordProgress | undefined;
  updateWordProgress: (wordId: string, quality: number) => void;

  // ===== 获取待学习/复习单词 =====
  getNewWordIds: (bookWordIds: string[], limit: number) => string[];
  getReviewWordIds: (bookWordIds: string[], limit: number) => string[];

  // ===== 统计 =====
  getTodayStats: () => LocalDailyStats;
  getStreak: () => number;
  getWordStatusCounts: (bookWordIds: string[]) => Record<WordStatus, number>;

  // ===== 会话 =====
  addSession: (session: Omit<LocalSession, "endTime"> & { endTime?: string }) => void;

  // ===== 设置 =====
  updateSettings: (settings: Partial<UserSettings>) => void;

  // ===== 云端同步 =====
  mergeCloudProgress: (cloudData: Record<string, LocalWordProgress>) => void;
  mergeCloudDailyStats: (cloudStats: Record<string, LocalDailyStats>) => void;

  // ===== 数据管理 =====
  clearAllData: () => void;
  exportData: () => string;
}

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      // ===== 初始状态 =====
      currentBookId: null,
      wordProgress: {},
      sessions: [],
      dailyStats: {},
      settings: DEFAULT_SETTINGS,

      // ===== 词库选择 =====
      setCurrentBook: (bookId) => set({ currentBookId: bookId }),

      // ===== 单词学习 =====
      getWordProgress: (wordId) => get().wordProgress[wordId],

      /** 根据用户评分更新单词进度（SM-2 算法） */
      updateWordProgress: (wordId, quality) => {
        const { wordProgress, dailyStats } = get();
        const prev = wordProgress[wordId];
        const today = formatDate(getToday());

        // 用 SM-2 算法计算新参数
        const sm2Prev = prev
          ? { repetitions: prev.repetitions, easinessFactor: prev.easinessFactor, interval: prev.interval }
          : SM2_DEFAULTS;
        const result = calculateSM2(quality, sm2Prev);

        const isNew = !prev || prev.status === "new";
        const isCorrect = quality >= 3;

        // 更新单词进度
        const newProgress: LocalWordProgress = {
          wordId,
          repetitions: result.repetitions,
          easinessFactor: result.easinessFactor,
          interval: result.interval,
          nextReviewDate: result.nextReviewDate.toISOString(),
          totalReviews: (prev?.totalReviews || 0) + 1,
          correctCount: (prev?.correctCount || 0) + (isCorrect ? 1 : 0),
          status: getWordStatus(result) as WordStatus,
          updatedAt: new Date().toISOString(),
        };

        // 更新每日统计
        const todayStats = dailyStats[today] || {
          date: today,
          wordsLearned: 0,
          wordsReviewed: 0,
          studyMinutes: 0,
        };

        set({
          wordProgress: { ...wordProgress, [wordId]: newProgress },
          dailyStats: {
            ...dailyStats,
            [today]: {
              ...todayStats,
              wordsLearned: todayStats.wordsLearned + (isNew ? 1 : 0),
              wordsReviewed: todayStats.wordsReviewed + (isNew ? 0 : 1),
            },
          },
        });

        // 异步推送到云端（未登录时服务端返回 401 会被静默忽略）
        pushSingleWord(wordId, newProgress);

        // 同步推送当日统计到云端
        const updatedTodayStats = get().dailyStats[today];
        if (updatedTodayStats) {
          pushDailyStats(today, updatedTodayStats);
        }
      },

      /** 获取需要学习的新词 ID 列表 */
      getNewWordIds: (bookWordIds, limit) => {
        const { wordProgress } = get();
        return bookWordIds
          .filter((id) => !wordProgress[id])
          .slice(0, limit);
      },

      /** 获取今日到期需要复习的单词 ID 列表 */
      getReviewWordIds: (bookWordIds, limit) => {
        const { wordProgress } = get();
        const now = new Date();
        return bookWordIds
          .filter((id) => {
            const p = wordProgress[id];
            if (!p) return false;
            return new Date(p.nextReviewDate) <= now && p.status !== "new";
          })
          .sort((a, b) => {
            const pa = wordProgress[a]!;
            const pb = wordProgress[b]!;
            return new Date(pa.nextReviewDate).getTime() - new Date(pb.nextReviewDate).getTime();
          })
          .slice(0, limit);
      },

      /** 获取今日学习统计 */
      getTodayStats: () => {
        const today = formatDate(getToday());
        return get().dailyStats[today] || {
          date: today,
          wordsLearned: 0,
          wordsReviewed: 0,
          studyMinutes: 0,
        };
      },

      /** 计算连续打卡天数 */
      getStreak: () => {
        const { dailyStats } = get();
        let streak = 0;
        const today = getToday();

        // 从今天开始往前数连续天数
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = formatDate(d);
          const stat = dailyStats[key];
          if (stat && (stat.wordsLearned > 0 || stat.wordsReviewed > 0)) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }

        return streak;
      },

      /** 统计词库中各状态的单词数量 */
      getWordStatusCounts: (bookWordIds) => {
        const { wordProgress } = get();
        const counts: Record<WordStatus, number> = {
          new: 0,
          learning: 0,
          review: 0,
          mastered: 0,
        };

        bookWordIds.forEach((id) => {
          const p = wordProgress[id];
          const status: WordStatus = p ? (p.status as WordStatus) : "new";
          counts[status]++;
        });

        return counts;
      },

      // ===== 云端同步 =====
      /** 将云端合并后的进度写入本地 store（fullSync 调用） */
      mergeCloudProgress: (mergedData) => {
        set({ wordProgress: mergedData });
      },

      /** 将云端合并后的每日统计写入本地 store（fullSyncDailyStats 调用） */
      mergeCloudDailyStats: (mergedStats) => {
        set({ dailyStats: mergedStats });
      },

      // ===== 会话 =====
      addSession: (session) => {
        set((state) => ({
          sessions: [
            ...state.sessions,
            { ...session, endTime: session.endTime || new Date().toISOString() },
          ].slice(-100), // 最多保留100条记录
        }));
      },

      // ===== 设置 =====
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // ===== 数据管理 =====
      clearAllData: () => {
        set({
          currentBookId: null,
          wordProgress: {},
          sessions: [],
          dailyStats: {},
          settings: DEFAULT_SETTINGS,
        });
      },

      exportData: () => {
        const { currentBookId, wordProgress, sessions, dailyStats, settings } = get();
        return JSON.stringify({
          currentBookId,
          wordProgress,
          sessions,
          dailyStats,
          settings,
          exportedAt: new Date().toISOString(),
        });
      },
    }),
    {
      name: "vocab-master-storage",
    }
  )
);

/**
 * 等待 Zustand persist 从 localStorage 恢复数据
 * 在依赖 persist 状态的组件中使用此 hook，避免 hydration 前读取到初始值
 */
export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useLearningStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // 如果已经 hydrated（比如重复调用），直接设为 true
    if (useLearningStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);
  return hydrated;
}
