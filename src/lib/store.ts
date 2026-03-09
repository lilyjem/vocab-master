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
  LocalAchievementProgress,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { calculateSM2, getWordStatus, SM2_DEFAULTS } from "@/lib/sm2";
import { formatDate, getToday } from "@/lib/utils";
import {
  checkAchievements,
  type AchievementStats,
  type AchievementResult,
} from "@/lib/achievements";

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

  // ===== 学习时长 =====
  addStudyMinutes: (minutes: number) => void;

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

  // ===== 本地成就（未登录用户） =====
  localAchievements: Record<string, LocalAchievementProgress>;
  checkLocalAchievements: () => AchievementResult[];
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

      // ===== 学习时长 =====
      /** 向今日统计追加学习时长（分钟），同步到云端 */
      addStudyMinutes: (minutes) => {
        if (minutes <= 0) return;

        const { dailyStats } = get();
        const today = formatDate(getToday());

        const todayStats = dailyStats[today] || {
          date: today,
          wordsLearned: 0,
          wordsReviewed: 0,
          studyMinutes: 0,
        };

        const updatedStats = {
          ...todayStats,
          studyMinutes: todayStats.studyMinutes + minutes,
        };

        set({
          dailyStats: {
            ...dailyStats,
            [today]: updatedStats,
          },
        });

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
          localAchievements: {},
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

      // ===== 本地成就（未登录用户） =====
      localAchievements: {},

      /** 从本地数据计算成就，更新 localAchievements，返回所有成就进度 */
      checkLocalAchievements: () => {
        const { wordProgress, dailyStats, sessions, getStreak } = get();

        // 1. 从 wordProgress 和 dailyStats 计算统计数据
        const totalWordsLearned = Object.keys(wordProgress).length;
        // 复习次数 = 每日统计中的 wordsReviewed 之和（不含首次学习新词）
        const totalReviews = Object.values(dailyStats).reduce(
          (sum, s) => sum + s.wordsReviewed,
          0
        );
        const currentStreak = getStreak();
        const totalStudyMinutes = Object.values(dailyStats).reduce(
          (sum, s) => sum + s.studyMinutes,
          0
        );

        // 最佳单次测验正确率（从 sessions）
        let bestAccuracy = 0;
        let totalSpellCorrect = 0;
        let earlyBirdCount = 0;
        let nightOwlCount = 0;
        let weekendWarriorCount = 0;
        for (const s of sessions) {
          if (s.totalCount > 0) {
            const acc = Math.round((s.correctCount / s.totalCount) * 100);
            if (acc > bestAccuracy) bestAccuracy = acc;
          }
          if (s.mode === "spell") totalSpellCorrect += s.correctCount;
          const d = new Date(s.startTime);
          const hour = d.getHours();
          if (hour >= 6 && hour < 8) earlyBirdCount++;
          if (hour >= 22 && hour < 24) nightOwlCount++;
          const day = d.getDay();
          if (day === 0 || day === 6) weekendWarriorCount++;
        }

        // 里程碑统计：单日学 100 词 / 单日学 120 分钟的天数
        let wordSlayerDays = 0;
        let marathonDays = 0;
        for (const s of Object.values(dailyStats)) {
          if ((s.wordsLearned + s.wordsReviewed) >= 100) wordSlayerDays++;
          if (s.studyMinutes >= 120) marathonDays++;
        }

        const stats: AchievementStats = {
          totalWordsLearned,
          currentStreak,
          totalReviews,
          bestAccuracy,
          totalSpellCorrect,
          booksCompleted: 0,
          totalStudyMinutes,
          earlyBirdCount,
          nightOwlCount,
          weekendWarriorCount,
          wordSlayerDays,
          marathonDays,
        };

        // 2. 调用成就引擎
        const results = checkAchievements(stats);

        // 3. 更新 localAchievements（新解锁时记录 unlockedAt）
        const now = new Date().toISOString();
        const prevAchievements = get().localAchievements;
        const tierOrder: Record<string, number> = {
          none: 0, bronze: 1, silver: 2, gold: 3,
          platinum: 4, diamond: 5, star: 6, king: 7,
        };
        const localAchievements: Record<string, LocalAchievementProgress> = {};
        for (const r of results) {
          const prev = prevAchievements[r.code];
          const isNewUnlock =
            !prev || tierOrder[r.tier] > tierOrder[prev.tier as keyof typeof tierOrder];
          localAchievements[r.code] = {
            code: r.code,
            tier: r.tier,
            progress: r.progress,
            unlockedAt:
              r.tier !== "none"
                ? isNewUnlock
                  ? now
                  : prev?.unlockedAt
                : undefined,
          };
        }

        set({ localAchievements });

        return results;
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
