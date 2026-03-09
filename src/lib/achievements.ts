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
  night_owl: { description: "晚上 22-24 点学习的次数", icon: "Moon" },
  weekend_warrior: { description: "周末学习的次数", icon: "Calendar" },
  word_slayer: { description: "单日学习 100 词的天数", icon: "Zap" },
  marathon: { description: "单日学习 120 分钟的天数", icon: "Timer" },
};

/** 成就定义（7 级阈值，参考王者荣耀段位体系） */
export const ACHIEVEMENT_DEFINITIONS = [
  { code: "vocab_learner",   name: "词汇新手",   bronze: 50,  silver: 200, gold: 500,  platinum: 1000, diamond: 2000, star: 3500,  king: 5000  },
  { code: "streak_master",   name: "坚持不懈",   bronze: 3,   silver: 7,   gold: 14,   platinum: 30,   diamond: 60,   star: 120,   king: 365   },
  { code: "review_expert",   name: "复习达人",   bronze: 50,  silver: 200, gold: 500,  platinum: 1000, diamond: 2000, star: 5000,  king: 10000 },
  { code: "accuracy_star",   name: "精准射手",   bronze: 60,  silver: 70,  gold: 80,   platinum: 85,   diamond: 90,   star: 95,    king: 100   },
  { code: "spell_master",    name: "拼写高手",   bronze: 30,  silver: 100, gold: 200,  platinum: 500,  diamond: 1000, star: 2000,  king: 5000  },
  { code: "book_conqueror",  name: "词书征服者", bronze: 1,   silver: 2,   gold: 3,    platinum: 5,    diamond: 8,    star: 12,    king: 20    },
  { code: "study_timer",     name: "学习时长",   bronze: 30,  silver: 120, gold: 300,  platinum: 600,  diamond: 1500, star: 3000,  king: 6000  },
  { code: "early_bird",      name: "早起鸟",     bronze: 3,   silver: 10,  gold: 20,   platinum: 50,   diamond: 100,  star: 200,   king: 365   },
  { code: "night_owl",       name: "夜猫子",     bronze: 3,   silver: 10,  gold: 20,   platinum: 50,   diamond: 100,  star: 200,   king: 365   },
  { code: "weekend_warrior", name: "周末战士",   bronze: 3,   silver: 10,  gold: 20,   platinum: 50,   diamond: 100,  star: 200,   king: 365   },
  { code: "word_slayer",     name: "百词斩",     bronze: 1,   silver: 3,   gold: 7,    platinum: 15,   diamond: 30,   star: 60,    king: 100   },
  { code: "marathon",        name: "马拉松",     bronze: 1,   silver: 3,   gold: 7,    platinum: 15,   diamond: 30,   star: 60,    king: 100   },
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
  earlyBirdCount: number; // 早起学习次数（6-8点）
  nightOwlCount: number; // 夜猫子学习次数（22-24点）
  weekendWarriorCount: number; // 周末学习次数
  wordSlayerDays: number; // 单日学 100 词的天数
  marathonDays: number; // 单日学 120 分钟的天数
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
 * 7 级阈值参数（与 ACHIEVEMENT_DEFINITIONS 结构对应）
 */
export interface TierThresholds {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  diamond: number;
  star: number;
  king: number;
}

/**
 * 根据进度值和阈值计算成就等级（7 级）
 */
export function calculateTier(
  progress: number,
  bronze: number,
  silver: number,
  gold: number,
  platinum: number = Infinity,
  diamond: number = Infinity,
  star: number = Infinity,
  king: number = Infinity,
): AchievementTier {
  if (progress >= king) return "king";
  if (progress >= star) return "star";
  if (progress >= diamond) return "diamond";
  if (progress >= platinum) return "platinum";
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
    night_owl: stats.nightOwlCount,
    weekend_warrior: stats.weekendWarriorCount,
    word_slayer: stats.wordSlayerDays,
    marathon: stats.marathonDays,
  };

  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const progress = statMapping[def.code] || 0;
    const tier = calculateTier(
      progress,
      def.bronze, def.silver, def.gold,
      def.platinum, def.diamond, def.star, def.king,
    );

    // 计算下一个等级的目标值（当前等级已满则显示当前等级阈值）
    const tierToNext: Record<AchievementTier, number> = {
      none: def.bronze,
      bronze: def.silver,
      silver: def.gold,
      gold: def.platinum,
      platinum: def.diamond,
      diamond: def.star,
      star: def.king,
      king: def.king,
    };
    const maxForCurrentTier = tierToNext[tier];

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
    platinum: 4,
    diamond: 5,
    star: 6,
    king: 7,
  };

  return newResults.filter((newR) => {
    const oldR = oldResults.find((o) => o.code === newR.code);
    if (!oldR) return newR.tier !== "none";
    return tierOrder[newR.tier] > tierOrder[oldR.tier];
  });
}
