/**
 * 服务器数据 Hook
 * 登录用户专用：所有数据以服务器为唯一真实来源
 * 使用 SWR 缓存服务器数据，写操作乐观更新 + 异步 API 调用
 */
"use client";

import { useCallback, useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import type {
  LocalWordProgress,
  LocalDailyStats,
  LocalSession,
  UserSettings,
  WordStatus,
  LocalAchievementProgress,
  AchievementTier,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { calculateSM2, getWordStatus, SM2_DEFAULTS } from "@/lib/sm2";
import { useLearningStore } from "@/lib/store";
import { formatDate, getToday, apiUrl } from "@/lib/utils";
import {
  checkAchievements,
  type AchievementStats,
  type AchievementResult,
} from "@/lib/achievements";

// ===== SWR Key 常量 =====
const SWR_KEY_PROGRESS = "/api/progress";
const SWR_KEY_DAILY_STATS = "/api/daily-stats";
const SWR_KEY_SETTINGS = "/api/user/settings";
const SWR_KEY_CURRENT_BOOK = "/api/user/current-book";
const SWR_KEY_SESSIONS = "/api/sessions";
const SWR_KEY_ACHIEVEMENTS = "/api/achievements";

/** 通用 JSON fetcher，自动添加 basePath */
async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) {
    throw new Error(`API 请求失败: ${res.status}`);
  }
  return res.json();
}

/** 通用 API 写入方法 */
async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API 写入失败: ${res.status}`);
  }
  return res.json();
}

async function apiPut(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(apiUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API 写入失败: ${res.status}`);
  }
  return res.json();
}

/** useServerData 返回的接口（与 useLearningStore 保持一致） */
export interface ServerDataInterface {
  // 状态
  currentBookId: string | null;
  wordProgress: Record<string, LocalWordProgress>;
  dailyStats: Record<string, LocalDailyStats>;
  sessions: LocalSession[];
  settings: UserSettings;
  localAchievements: Record<string, LocalAchievementProgress>;

  // 词库选择
  setCurrentBook: (bookId: string) => void;

  // 单词学习
  getWordProgress: (wordId: string) => LocalWordProgress | undefined;
  updateWordProgress: (wordId: string, quality: number) => void;

  // 获取待学习/复习单词
  getNewWordIds: (bookWordIds: string[], limit: number) => string[];
  getReviewWordIds: (bookWordIds: string[], limit: number) => string[];

  // 统计
  getTodayStats: () => LocalDailyStats;
  getStreak: () => number;
  getWordStatusCounts: (bookWordIds: string[]) => Record<WordStatus, number>;

  // 学习时长
  addStudyMinutes: (minutes: number) => void;

  // 会话
  addSession: (session: Omit<LocalSession, "endTime"> & { endTime?: string }) => void;

  // 设置
  updateSettings: (settings: Partial<UserSettings>) => void;

  // 成就
  checkLocalAchievements: () => AchievementResult[];

  // 成就通知防重复
  shownAchievementTiers: Record<string, AchievementTier>;
  markAchievementShown: (code: string, tier: AchievementTier) => void;

  // 数据管理
  clearAllData: () => void;
  exportData: () => string;

  // 云端同步（兼容接口，server-first 模式下为空操作）
  mergeCloudProgress: (cloudData: Record<string, LocalWordProgress>) => void;
  mergeCloudDailyStats: (cloudStats: Record<string, LocalDailyStats>) => void;

  // 加载状态
  isLoading: boolean;
}

/**
 * 服务器数据 Hook
 * 登录用户使用此 hook 替代 useLearningStore
 * 所有数据从服务器获取，写操作乐观更新 SWR 缓存后异步写服务器
 */
export function useServerData(): ServerDataInterface {
  // 成就通知防重复（UI 层状态，复用本地 store，不存服务器）
  const shownAchievementTiers = useLearningStore((s) => s.shownAchievementTiers);
  const markAchievementShown = useLearningStore((s) => s.markAchievementShown);

  // ===== SWR 数据获取 =====
  const { data: progressData, isLoading: progressLoading } = useSWR<
    Record<string, LocalWordProgress>
  >(SWR_KEY_PROGRESS, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const { data: dailyStatsData, isLoading: statsLoading } = useSWR<
    Record<string, LocalDailyStats>
  >(SWR_KEY_DAILY_STATS, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const { data: settingsData, isLoading: settingsLoading } = useSWR<UserSettings>(
    SWR_KEY_SETTINGS,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const { data: currentBookData, isLoading: bookLoading } = useSWR<{
    currentBookId: string | null;
  }>(SWR_KEY_CURRENT_BOOK, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useSWR<
    LocalSession[]
  >(SWR_KEY_SESSIONS, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  // ===== 解构数据，提供默认值 =====
  const wordProgress = useMemo(() => progressData ?? {}, [progressData]);
  const dailyStats = useMemo(() => dailyStatsData ?? {}, [dailyStatsData]);
  const settings = settingsData ?? DEFAULT_SETTINGS;
  const currentBookId = currentBookData?.currentBookId ?? null;
  const sessions = useMemo(() => sessionsData ?? [], [sessionsData]);

  const isLoading =
    progressLoading || statsLoading || settingsLoading || bookLoading || sessionsLoading;

  // ===== 词库选择 =====
  const setCurrentBook = useCallback((bookId: string) => {
    // 乐观更新
    globalMutate(
      SWR_KEY_CURRENT_BOOK,
      { currentBookId: bookId },
      false
    );
    // 异步写服务器
    apiPut(SWR_KEY_CURRENT_BOOK, { bookId }).catch(console.error);
  }, []);

  // ===== 单词学习 =====
  const getWordProgress = useCallback(
    (wordId: string) => wordProgress[wordId],
    [wordProgress]
  );

  const updateWordProgress = useCallback(
    (wordId: string, quality: number) => {
      const prev = wordProgress[wordId];
      const today = formatDate(getToday());

      // SM-2 算法计算新参数
      const sm2Prev = prev
        ? {
            repetitions: prev.repetitions,
            easinessFactor: prev.easinessFactor,
            interval: prev.interval,
          }
        : SM2_DEFAULTS;
      const result = calculateSM2(quality, sm2Prev);

      const isNew = !prev || prev.status === "new";
      const isCorrect = quality >= 3;

      // 构建新进度
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

      // 乐观更新进度 SWR 缓存
      globalMutate(
        SWR_KEY_PROGRESS,
        (current: Record<string, LocalWordProgress> | undefined) => ({
          ...current,
          [wordId]: newProgress,
        }),
        false
      );

      // 乐观更新每日统计 SWR 缓存
      globalMutate(
        SWR_KEY_DAILY_STATS,
        (current: Record<string, LocalDailyStats> | undefined) => {
          const todayStats = current?.[today] || {
            date: today,
            wordsLearned: 0,
            wordsReviewed: 0,
            studyMinutes: 0,
          };
          return {
            ...current,
            [today]: {
              ...todayStats,
              wordsLearned: todayStats.wordsLearned + (isNew ? 1 : 0),
              wordsReviewed: todayStats.wordsReviewed + (isNew ? 0 : 1),
            },
          };
        },
        false
      );

      // 异步写服务器
      apiPost("/api/progress", {
        wordProgress: { [wordId]: newProgress },
      }).catch(console.error);

      // 异步推送每日统计
      const updatedTodayStats = {
        date: today,
        wordsLearned:
          (dailyStats[today]?.wordsLearned || 0) + (isNew ? 1 : 0),
        wordsReviewed:
          (dailyStats[today]?.wordsReviewed || 0) + (isNew ? 0 : 1),
        studyMinutes: dailyStats[today]?.studyMinutes || 0,
      };
      apiPost("/api/daily-stats", {
        dailyStats: { [today]: updatedTodayStats },
      }).catch(console.error);
    },
    [wordProgress, dailyStats]
  );

  // ===== 获取待学习/复习单词 =====
  const getNewWordIds = useCallback(
    (bookWordIds: string[], limit: number) => {
      return bookWordIds.filter((id) => !wordProgress[id]).slice(0, limit);
    },
    [wordProgress]
  );

  const getReviewWordIds = useCallback(
    (bookWordIds: string[], limit: number) => {
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
          return (
            new Date(pa.nextReviewDate).getTime() -
            new Date(pb.nextReviewDate).getTime()
          );
        })
        .slice(0, limit);
    },
    [wordProgress]
  );

  // ===== 统计 =====
  const getTodayStats = useCallback(() => {
    const today = formatDate(getToday());
    return (
      dailyStats[today] || {
        date: today,
        wordsLearned: 0,
        wordsReviewed: 0,
        studyMinutes: 0,
      }
    );
  }, [dailyStats]);

  const getStreak = useCallback(() => {
    let streak = 0;
    const today = getToday();

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
  }, [dailyStats]);

  const getWordStatusCounts = useCallback(
    (bookWordIds: string[]) => {
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
    [wordProgress]
  );

  // ===== 学习时长 =====
  const addStudyMinutes = useCallback(
    (minutes: number) => {
      if (minutes <= 0) return;

      const today = formatDate(getToday());

      // 乐观更新
      globalMutate(
        SWR_KEY_DAILY_STATS,
        (current: Record<string, LocalDailyStats> | undefined) => {
          const todayStats = current?.[today] || {
            date: today,
            wordsLearned: 0,
            wordsReviewed: 0,
            studyMinutes: 0,
          };
          return {
            ...current,
            [today]: {
              ...todayStats,
              studyMinutes: todayStats.studyMinutes + minutes,
            },
          };
        },
        false
      );

      // 异步写服务器
      const updatedStats = {
        date: today,
        wordsLearned: dailyStats[today]?.wordsLearned || 0,
        wordsReviewed: dailyStats[today]?.wordsReviewed || 0,
        studyMinutes: (dailyStats[today]?.studyMinutes || 0) + minutes,
      };
      apiPost("/api/daily-stats", {
        dailyStats: { [today]: updatedStats },
      }).catch(console.error);
    },
    [dailyStats]
  );

  // ===== 会话 =====
  const addSession = useCallback(
    (session: Omit<LocalSession, "endTime"> & { endTime?: string }) => {
      const fullSession: LocalSession = {
        ...session,
        endTime: session.endTime || new Date().toISOString(),
      };

      // 乐观更新
      globalMutate(
        SWR_KEY_SESSIONS,
        (current: LocalSession[] | undefined) =>
          [...(current || []), fullSession].slice(-100),
        false
      );

      // 异步写服务器
      apiPost("/api/sessions", fullSession).catch(console.error);
    },
    []
  );

  // ===== 设置 =====
  const updateSettings = useCallback(
    (newSettings: Partial<UserSettings>) => {
      // 乐观更新
      globalMutate(
        SWR_KEY_SETTINGS,
        (current: UserSettings | undefined) => ({
          ...(current || DEFAULT_SETTINGS),
          ...newSettings,
        }),
        false
      );

      // 异步写服务器
      apiPut("/api/user/settings", newSettings).catch(console.error);
    },
    []
  );

  // ===== 成就 =====
  const checkLocalAchievements = useCallback(() => {
    const totalWordsLearned = Object.keys(wordProgress).length;
    // 复习次数 = 每日统计中的 wordsReviewed 之和（不含首次学习新词）
    const totalReviews = Object.values(dailyStats).reduce(
      (sum, s) => sum + s.wordsReviewed,
      0
    );
    const currentStreak = (() => {
      let s = 0;
      const today = getToday();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = formatDate(d);
        const stat = dailyStats[key];
        if (stat && (stat.wordsLearned > 0 || stat.wordsReviewed > 0)) {
          s++;
        } else if (i > 0) {
          break;
        }
      }
      return s;
    })();
    const totalStudyMinutes = Object.values(dailyStats).reduce(
      (sum, s) => sum + s.studyMinutes,
      0
    );

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

    return checkAchievements(stats);
  }, [wordProgress, dailyStats, sessions]);

  // ===== 本地成就进度（从服务器数据计算） =====
  const localAchievements = useMemo(() => {
    const results = checkLocalAchievements();
    const achievements: Record<string, LocalAchievementProgress> = {};
    for (const r of results) {
      achievements[r.code] = {
        code: r.code,
        tier: r.tier,
        progress: r.progress,
      };
    }
    return achievements;
  }, [checkLocalAchievements]);

  // ===== 数据管理 =====
  const clearAllData = useCallback(() => {
    // 服务器模式下，清除所有 SWR 缓存并重新获取
    globalMutate(SWR_KEY_PROGRESS, {}, false);
    globalMutate(SWR_KEY_DAILY_STATS, {}, false);
    globalMutate(SWR_KEY_SETTINGS, DEFAULT_SETTINGS, false);
    globalMutate(SWR_KEY_CURRENT_BOOK, { currentBookId: null }, false);
    globalMutate(SWR_KEY_SESSIONS, [], false);
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify({
      currentBookId,
      wordProgress,
      sessions,
      dailyStats,
      settings,
      exportedAt: new Date().toISOString(),
    });
  }, [currentBookId, wordProgress, sessions, dailyStats, settings]);

  // ===== 兼容接口（server-first 模式下为空操作） =====
  const mergeCloudProgress = useCallback(() => {}, []);
  const mergeCloudDailyStats = useCallback(() => {}, []);

  return {
    currentBookId,
    wordProgress,
    dailyStats,
    sessions,
    settings,
    localAchievements,
    setCurrentBook,
    getWordProgress,
    updateWordProgress,
    getNewWordIds,
    getReviewWordIds,
    getTodayStats,
    getStreak,
    getWordStatusCounts,
    addStudyMinutes,
    addSession,
    updateSettings,
    checkLocalAchievements,
    shownAchievementTiers,
    markAchievementShown,
    clearAllData,
    exportData,
    mergeCloudProgress,
    mergeCloudDailyStats,
    isLoading,
  };
}
