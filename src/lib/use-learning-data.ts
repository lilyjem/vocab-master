/**
 * 统一学习数据 Hook
 * 根据登录状态自动选择数据源：
 * - 登录用户 → useServerData（服务器为唯一真实来源）
 * - 未登录用户 → useLearningStore（localStorage 本地存储）
 */
"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useLearningStore, useStoreHydrated } from "@/lib/store";
import { useServerData, type ServerDataInterface } from "@/lib/use-server-data";
import type {
  LocalWordProgress,
  LocalDailyStats,
  LocalSession,
  UserSettings,
  WordStatus,
  LocalAchievementProgress,
} from "@/types";
import type { AchievementResult } from "@/lib/achievements";

/** useLearningData 返回的统一接口 */
export interface LearningDataInterface {
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

  // 数据管理
  clearAllData: () => void;
  exportData: () => string;

  // 数据就绪状态（替代 useStoreHydrated）
  hydrated: boolean;

  // 是否为服务器模式
  isServerMode: boolean;
}

/**
 * 统一学习数据 Hook
 * 组件只需调用此 hook，无需关心数据来源
 */
export function useLearningData(): LearningDataInterface {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  // 服务器数据（登录用户）
  const serverData = useServerData();

  // 本地数据（未登录用户）
  const localStore = useLearningStore();
  const localHydrated = useStoreHydrated();

  // 根据登录状态选择数据源
  return useMemo<LearningDataInterface>(() => {
    if (isAuthenticated) {
      return {
        currentBookId: serverData.currentBookId,
        wordProgress: serverData.wordProgress,
        dailyStats: serverData.dailyStats,
        sessions: serverData.sessions,
        settings: serverData.settings,
        localAchievements: serverData.localAchievements,
        setCurrentBook: serverData.setCurrentBook,
        getWordProgress: serverData.getWordProgress,
        updateWordProgress: serverData.updateWordProgress,
        getNewWordIds: serverData.getNewWordIds,
        getReviewWordIds: serverData.getReviewWordIds,
        getTodayStats: serverData.getTodayStats,
        getStreak: serverData.getStreak,
        getWordStatusCounts: serverData.getWordStatusCounts,
        addStudyMinutes: serverData.addStudyMinutes,
        addSession: serverData.addSession,
        updateSettings: serverData.updateSettings,
        checkLocalAchievements: serverData.checkLocalAchievements,
        clearAllData: serverData.clearAllData,
        exportData: serverData.exportData,
        hydrated: !serverData.isLoading,
        isServerMode: true,
      };
    }

    return {
      currentBookId: localStore.currentBookId,
      wordProgress: localStore.wordProgress,
      dailyStats: localStore.dailyStats,
      sessions: localStore.sessions,
      settings: localStore.settings,
      localAchievements: localStore.localAchievements,
      setCurrentBook: localStore.setCurrentBook,
      getWordProgress: localStore.getWordProgress,
      updateWordProgress: localStore.updateWordProgress,
      getNewWordIds: localStore.getNewWordIds,
      getReviewWordIds: localStore.getReviewWordIds,
      getTodayStats: localStore.getTodayStats,
      getStreak: localStore.getStreak,
      getWordStatusCounts: localStore.getWordStatusCounts,
      addStudyMinutes: localStore.addStudyMinutes,
      addSession: localStore.addSession,
      updateSettings: localStore.updateSettings,
      checkLocalAchievements: localStore.checkLocalAchievements,
      clearAllData: localStore.clearAllData,
      exportData: localStore.exportData,
      hydrated: localHydrated,
      isServerMode: false,
    };
  }, [isAuthenticated, serverData, localStore, localHydrated]);
}
