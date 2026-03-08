/**
 * VocabMaster 全局类型定义
 */

/** 词库信息 */
export interface WordBook {
  id: string;
  name: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  category: "exam" | "general";
  wordCount: number;
  coverColor: string;
  sortOrder: number;
}

/** 单词信息 */
export interface Word {
  id: string;
  bookId: string;
  word: string;
  phonetic?: string;
  definition: string;
  partOfSpeech?: string;
  example?: string;
  exampleTranslation?: string;
  difficulty: number;
  frequency?: number; // 词频排名（数值越大越常用）
}

/** 用户单词学习进度 */
export interface WordProgress {
  id: string;
  userId: string;
  wordId: string;
  repetitions: number;
  easinessFactor: number;
  interval: number;
  nextReviewDate: string;
  totalReviews: number;
  correctCount: number;
  status: WordStatus;
}

/** 单词掌握状态 */
export type WordStatus = "new" | "learning" | "review" | "mastered";

/** 学习模式 */
export type LearningMode = "learn" | "review" | "spell" | "quiz";

/** 学习会话 */
export interface LearningSession {
  id: string;
  userId: string;
  bookId?: string;
  mode: LearningMode;
  startTime: string;
  endTime?: string;
  newWordsCount: number;
  reviewWordsCount: number;
  correctCount: number;
  totalCount: number;
}

/** 每日打卡 */
export interface DailyCheckIn {
  id: string;
  userId: string;
  checkInDate: string;
  wordsLearned: number;
  wordsReviewed: number;
  studyMinutes: number;
  streak: number;
}

/** 学习统计摘要 */
export interface LearningStats {
  totalWords: number;       // 总词汇量
  masteredWords: number;    // 已掌握
  learningWords: number;    // 学习中
  reviewWords: number;      // 待复习
  newWords: number;         // 新词
  todayLearned: number;     // 今日学习
  todayReviewed: number;    // 今日复习
  streak: number;           // 连续打卡天数
  accuracy: number;         // 正确率
}

/** 单词带学习进度（前端展示用） */
export interface WordWithProgress extends Word {
  progress?: WordProgress;
}

/** 本地存储的学习数据（未登录用户） */
export interface LocalLearningData {
  currentBookId: string | null;
  wordProgress: Record<string, LocalWordProgress>;
  sessions: LocalSession[];
  dailyStats: Record<string, LocalDailyStats>;
  settings: UserSettings;
}

/** 本地单词进度 */
export interface LocalWordProgress {
  wordId: string;
  repetitions: number;
  easinessFactor: number;
  interval: number;
  nextReviewDate: string;
  totalReviews: number;
  correctCount: number;
  status: WordStatus;
  updatedAt: string; // ISO 时间戳，用于跨设备同步时冲突判断
}

/** 本地学习会话 */
export interface LocalSession {
  mode: LearningMode;
  bookId?: string;
  startTime: string;
  endTime: string;
  newWordsCount: number;
  reviewWordsCount: number;
  correctCount: number;
  totalCount: number;
}

/** 本地每日统计 */
export interface LocalDailyStats {
  date: string;
  wordsLearned: number;
  wordsReviewed: number;
  studyMinutes: number;
}

/** 发音类型 */
export type PronunciationType = "en-US" | "en-GB";

/** 用户学习设置 */
export interface UserSettings {
  dailyNewWords: number;     // 每日新词数量
  dailyReviewWords: number;  // 每日复习数量
  autoPlayAudio: boolean;    // 自动播放发音
  showPhonetic: boolean;     // 显示音标
  pronunciation: PronunciationType; // 发音类型：美式/英式
  theme: "light" | "dark" | "system"; // 主题
}

/** 默认用户设置 */
export const DEFAULT_SETTINGS: UserSettings = {
  dailyNewWords: 20,
  dailyReviewWords: 50,
  autoPlayAudio: true,
  showPhonetic: true,
  pronunciation: "en-US",
  theme: "system",
};

/** 成就等级 */
export type AchievementTier = "none" | "bronze" | "silver" | "gold";

/** 成就定义 */
export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
}

/** 用户成就进度 */
export interface UserAchievement {
  id: string;
  achievementId: string;
  tier: AchievementTier;
  progress: number;
  unlockedAt?: string;
  notified?: boolean;
  achievement?: Achievement;
}

/** 本地成就进度（未登录用户） */
export interface LocalAchievementProgress {
  code: string;
  tier: AchievementTier;
  progress: number;
  unlockedAt?: string;
}
