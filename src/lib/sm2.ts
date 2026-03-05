/**
 * SM-2 间隔重复算法实现
 *
 * SuperMemo 2 算法是目前最成熟的记忆算法之一
 * 通过用户对单词的评分（0-5），自动计算下次复习时间
 *
 * 评分含义:
 *   0 - 完全不记得
 *   1 - 看到答案后才想起
 *   2 - 想起来了但很困难
 *   3 - 勉强记住，有些犹豫
 *   4 - 经过思考后记住了
 *   5 - 轻松完全记住
 */

/** SM-2 算法参数接口 */
export interface SM2Params {
  repetitions: number; // 连续正确作答次数
  easinessFactor: number; // 难度因子（最低 1.3）
  interval: number; // 当前复习间隔（天）
}

/** SM-2 算法返回结果 */
export interface SM2Result extends SM2Params {
  nextReviewDate: Date; // 下次复习的具体日期
}

/** 初始化 SM-2 参数（新单词默认值） */
export const SM2_DEFAULTS: SM2Params = {
  repetitions: 0,
  easinessFactor: 2.5,
  interval: 0,
};

/**
 * SM-2 核心算法
 *
 * @param quality 用户评分（0-5）
 * @param prev 上一次的 SM-2 参数
 * @returns 新的 SM-2 参数及下次复习日期
 */
export function calculateSM2(quality: number, prev: SM2Params): SM2Result {
  // 限制评分范围 0-5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { repetitions, easinessFactor, interval } = prev;

  if (q < 3) {
    // 评分低于3，说明没记住，重置复习次数
    repetitions = 0;
    interval = 1;
  } else {
    // 评分>=3，计算新的间隔
    if (repetitions === 0) {
      interval = 1; // 第一次正确：1天后复习
    } else if (repetitions === 1) {
      interval = 6; // 第二次正确：6天后复习
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  }

  // 更新难度因子（EF），最低不低于 1.3
  easinessFactor = Math.max(
    1.3,
    easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  // 计算下次复习日期
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    repetitions,
    easinessFactor,
    interval,
    nextReviewDate,
  };
}

/**
 * 根据 SM-2 参数判断单词的掌握状态
 */
export function getWordStatus(params: SM2Params): string {
  if (params.repetitions === 0 && params.interval === 0) return "new";
  if (params.repetitions < 2) return "learning";
  if (params.interval >= 21) return "mastered";
  return "review";
}

/**
 * 将评分映射为用户友好的标签
 */
export const QUALITY_LABELS: Record<number, { label: string; color: string; description: string }> = {
  0: { label: "完全不会", color: "#ef4444", description: "完全不记得这个单词" },
  1: { label: "几乎不会", color: "#f97316", description: "看到答案才想起来" },
  2: { label: "很模糊", color: "#f59e0b", description: "想起来了但很困难" },
  3: { label: "勉强记住", color: "#eab308", description: "犹豫了一下才记起" },
  4: { label: "记住了", color: "#22c55e", description: "思考后能回忆起来" },
  5: { label: "很熟悉", color: "#10b981", description: "轻松就想起来了" },
};
