/**
 * 成就种子数据 - 12 个成就的定义
 * 每个成就有铜/银/金三个等级
 */

export interface AchievementSeed {
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
}

/** 12 个成就定义 */
export const ACHIEVEMENTS: AchievementSeed[] = [
  {
    code: "vocab_learner",
    name: "词汇新手",
    description: "累计学习单词数量",
    category: "learning",
    icon: "BookOpen",
    bronzeThreshold: 50,
    silverThreshold: 500,
    goldThreshold: 2000,
  },
  {
    code: "streak_master",
    name: "坚持不懈",
    description: "连续打卡天数",
    category: "streak",
    icon: "Flame",
    bronzeThreshold: 3,
    silverThreshold: 14,
    goldThreshold: 30,
  },
  {
    code: "review_expert",
    name: "复习达人",
    description: "累计复习次数",
    category: "review",
    icon: "Target",
    bronzeThreshold: 100,
    silverThreshold: 500,
    goldThreshold: 2000,
  },
  {
    code: "accuracy_star",
    name: "精准射手",
    description: "单次测验正确率",
    category: "accuracy",
    icon: "Award",
    bronzeThreshold: 80,
    silverThreshold: 95,
    goldThreshold: 100,
  },
  {
    code: "spell_master",
    name: "拼写高手",
    description: "拼写正确的单词数量",
    category: "spelling",
    icon: "PenTool",
    bronzeThreshold: 50,
    silverThreshold: 200,
    goldThreshold: 500,
  },
  {
    code: "book_conqueror",
    name: "词书征服者",
    description: "完成的词书数量",
    category: "book",
    icon: "Trophy",
    bronzeThreshold: 1,
    silverThreshold: 3,
    goldThreshold: 6,
  },
  {
    code: "study_timer",
    name: "学习时长",
    description: "累计学习时长（分钟）",
    category: "time",
    icon: "Clock",
    bronzeThreshold: 60,
    silverThreshold: 600,
    goldThreshold: 3000,
  },
  {
    code: "early_bird",
    name: "早起鸟",
    description: "早上 6-8 点学习的次数",
    category: "habit",
    icon: "Sunrise",
    bronzeThreshold: 5,
    silverThreshold: 20,
    goldThreshold: 50,
  },
  {
    code: "night_owl",
    name: "夜猫子",
    description: "晚上 22-24 点学习的次数",
    category: "challenge",
    icon: "Moon",
    bronzeThreshold: 5,
    silverThreshold: 20,
    goldThreshold: 50,
  },
  {
    code: "weekend_warrior",
    name: "周末战士",
    description: "周末学习的次数",
    category: "challenge",
    icon: "Calendar",
    bronzeThreshold: 5,
    silverThreshold: 20,
    goldThreshold: 50,
  },
  {
    code: "word_slayer",
    name: "百词斩",
    description: "单日学习 100 词的天数",
    category: "milestone",
    icon: "Zap",
    bronzeThreshold: 1,
    silverThreshold: 5,
    goldThreshold: 20,
  },
  {
    code: "marathon",
    name: "马拉松",
    description: "单日学习 120 分钟的天数",
    category: "milestone",
    icon: "Timer",
    bronzeThreshold: 1,
    silverThreshold: 5,
    goldThreshold: 20,
  },
];
