/**
 * 成就检查引擎
 * 纯函数：根据用户统计数据计算成就进度
 */
import type { AchievementTier } from "@/types";

/** 成就元数据（描述、图标，与种子数据对应） */
export const ACHIEVEMENT_META: Record<
  string,
  { description: string; icon: string }
> = {
  vocab_learner: { description: "累计学习单词数量", icon: "BookOpen" },
  streak_master: { description: "连续打卡天数", icon: "Flame" },
  review_expert: { description: "累计复习次数", icon: "Target" },
  accuracy_star: { description: "单次测验正确率", icon: "Award" },
  spell_master: { description: "拼写正确的单词数量", icon: "PenTool" },
  book_conqueror: { description: "完成的词书数量", icon: "Trophy" },
  study_timer: { description: "累计学习时长（分钟）", icon: "Clock" },
  early_bird: { description: "早上 6-8 点学习的次数", icon: "Sunrise" },
};

/** 成就定义（与种子数据对应） */
export const ACHIEVEMENT_DEFINITIONS = [
  { code: "vocab_learner", name: "词汇新手", bronze: 50, silver: 500, gold: 2000 },
  { code: "streak_master", name: "坚持不懈", bronze: 3, silver: 14, gold: 30 },
  { code: "review_expert", name: "复习达人", bronze: 100, silver: 500, gold: 2000 },
  { code: "accuracy_star", name: "精准射手", bronze: 80, silver: 95, gold: 100 },
  { code: "spell_master", name: "拼写高手", bronze: 50, silver: 200, gold: 500 },
  { code: "book_conqueror", name: "词书征服者", bronze: 1, silver: 3, gold: 6 },
  { code: "study_timer", name: "学习时长", bronze: 60, silver: 600, gold: 3000 },
  { code: "early_bird", name: "早起鸟", bronze: 5, silver: 20, gold: 50 },
] as const;

/** 用户统计数据（用于成就判定） */
export interface AchievementStats {
  totalWordsLearned: number; // 累计学习单词数
  currentStreak: number; // 当前连续打卡天数
  totalReviews: number; // 累计复习次数
  bestAccuracy: number; // 最佳单次测验正确率 (0-100)
  totalSpellCorrect: number; // 拼写正确总数
  booksCompleted: number; // 完成词书数
  totalStudyMinutes: number; // 累计学习分钟数
  earlyBirdCount: number; // 早起学习次数
}

/** 成就检查结果 */
export interface AchievementResult {
  code: string;
  name: string;
  tier: AchievementTier;
  progress: number;
  maxForCurrentTier: number; // 下一个等级的阈值
}

/**
 * 根据进度值和阈值计算成就等级
 */
export function calculateTier(
  progress: number,
  bronze: number,
  silver: number,
  gold: number
): AchievementTier {
  if (progress >= gold) return "gold";
  if (progress >= silver) return "silver";
  if (progress >= bronze) return "bronze";
  return "none";
}

/**
 * 检查所有成就的当前状态
 * 纯函数：接收用户统计数据，返回所有成就的进度
 */
export function checkAchievements(stats: AchievementStats): AchievementResult[] {
  const statMapping: Record<string, number> = {
    vocab_learner: stats.totalWordsLearned,
    streak_master: stats.currentStreak,
    review_expert: stats.totalReviews,
    accuracy_star: stats.bestAccuracy,
    spell_master: stats.totalSpellCorrect,
    book_conqueror: stats.booksCompleted,
    study_timer: stats.totalStudyMinutes,
    early_bird: stats.earlyBirdCount,
  };

  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const progress = statMapping[def.code] || 0;
    const tier = calculateTier(progress, def.bronze, def.silver, def.gold);

    // 计算下一个等级的目标值
    let maxForCurrentTier: number;
    if (tier === "gold") maxForCurrentTier = def.gold;
    else if (tier === "silver") maxForCurrentTier = def.gold;
    else if (tier === "bronze") maxForCurrentTier = def.silver;
    else maxForCurrentTier = def.bronze;

    return {
      code: def.code,
      name: def.name,
      tier,
      progress,
      maxForCurrentTier,
    };
  });
}

/**
 * 比较新旧成就状态，找出新解锁的成就
 */
export function findNewUnlocks(
  oldResults: AchievementResult[],
  newResults: AchievementResult[]
): AchievementResult[] {
  const tierOrder: Record<AchievementTier, number> = {
    none: 0,
    bronze: 1,
    silver: 2,
    gold: 3,
  };

  return newResults.filter((newR) => {
    const oldR = oldResults.find((o) => o.code === newR.code);
    if (!oldR) return newR.tier !== "none";
    return tierOrder[newR.tier] > tierOrder[oldR.tier];
  });
}
