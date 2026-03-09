import { describe, it, expect } from "@jest/globals";
import {
  calculateTier,
  checkAchievements,
  findNewUnlocks,
} from "../achievements";
import type { AchievementStats } from "../achievements";

describe("calculateTier（7 级等级体系）", () => {
  // 以 vocab_learner 的阈值为例：50, 200, 500, 1000, 2000, 3500, 5000
  const b = 50, s = 200, g = 500, p = 1000, d = 2000, st = 3500, k = 5000;

  it("进度不足时返回 none", () => {
    expect(calculateTier(0, b, s, g, p, d, st, k)).toBe("none");
    expect(calculateTier(49, b, s, g, p, d, st, k)).toBe("none");
  });

  it("达到青铜阈值返回 bronze", () => {
    expect(calculateTier(50, b, s, g, p, d, st, k)).toBe("bronze");
    expect(calculateTier(199, b, s, g, p, d, st, k)).toBe("bronze");
  });

  it("达到白银阈值返回 silver", () => {
    expect(calculateTier(200, b, s, g, p, d, st, k)).toBe("silver");
    expect(calculateTier(499, b, s, g, p, d, st, k)).toBe("silver");
  });

  it("达到黄金阈值返回 gold", () => {
    expect(calculateTier(500, b, s, g, p, d, st, k)).toBe("gold");
    expect(calculateTier(999, b, s, g, p, d, st, k)).toBe("gold");
  });

  it("达到铂金阈值返回 platinum", () => {
    expect(calculateTier(1000, b, s, g, p, d, st, k)).toBe("platinum");
    expect(calculateTier(1999, b, s, g, p, d, st, k)).toBe("platinum");
  });

  it("达到钻石阈值返回 diamond", () => {
    expect(calculateTier(2000, b, s, g, p, d, st, k)).toBe("diamond");
    expect(calculateTier(3499, b, s, g, p, d, st, k)).toBe("diamond");
  });

  it("达到星耀阈值返回 star", () => {
    expect(calculateTier(3500, b, s, g, p, d, st, k)).toBe("star");
    expect(calculateTier(4999, b, s, g, p, d, st, k)).toBe("star");
  });

  it("达到王者阈值返回 king", () => {
    expect(calculateTier(5000, b, s, g, p, d, st, k)).toBe("king");
    expect(calculateTier(99999, b, s, g, p, d, st, k)).toBe("king");
  });

  it("向后兼容：仅传 3 级阈值时正常工作", () => {
    expect(calculateTier(50, 50, 500, 2000)).toBe("bronze");
    expect(calculateTier(500, 50, 500, 2000)).toBe("silver");
    expect(calculateTier(2000, 50, 500, 2000)).toBe("gold");
  });
});

describe("checkAchievements", () => {
  const emptyStats: AchievementStats = {
    totalWordsLearned: 0,
    currentStreak: 0,
    totalReviews: 0,
    bestAccuracy: 0,
    totalSpellCorrect: 0,
    booksCompleted: 0,
    totalStudyMinutes: 0,
    earlyBirdCount: 0,
    nightOwlCount: 0,
    weekendWarriorCount: 0,
    wordSlayerDays: 0,
    marathonDays: 0,
  };

  it("零统计时所有成就为 none", () => {
    const results = checkAchievements(emptyStats);
    expect(results).toHaveLength(12);
    results.forEach((r) => expect(r.tier).toBe("none"));
  });

  it("学习 50 词应解锁词汇新手青铜", () => {
    const stats = { ...emptyStats, totalWordsLearned: 50 };
    const results = checkAchievements(stats);
    const vocab = results.find((r) => r.code === "vocab_learner");
    expect(vocab?.tier).toBe("bronze");
    expect(vocab?.progress).toBe(50);
    // 下一级目标是白银（200）
    expect(vocab?.maxForCurrentTier).toBe(200);
  });

  it("连续打卡 14 天应解锁坚持不懈黄金", () => {
    const stats = { ...emptyStats, currentStreak: 14 };
    const results = checkAchievements(stats);
    const streak = results.find((r) => r.code === "streak_master");
    expect(streak?.tier).toBe("gold");
    // 下一级目标是铂金（30）
    expect(streak?.maxForCurrentTier).toBe(30);
  });

  it("学习 5000 词应达到词汇新手王者", () => {
    const stats = { ...emptyStats, totalWordsLearned: 5000 };
    const results = checkAchievements(stats);
    const vocab = results.find((r) => r.code === "vocab_learner");
    expect(vocab?.tier).toBe("king");
    // 最高级，目标值等于 king 阈值
    expect(vocab?.maxForCurrentTier).toBe(5000);
  });

  it("多个成就可以同时达到高等级", () => {
    const stats = {
      ...emptyStats,
      totalWordsLearned: 2000,  // diamond
      currentStreak: 60,        // diamond
      totalStudyMinutes: 1500,  // diamond
    };
    const results = checkAchievements(stats);
    const diamonds = results.filter((r) => r.tier === "diamond");
    expect(diamonds.length).toBe(3);
  });

  it("铂金等级门槛正确", () => {
    const stats = { ...emptyStats, totalWordsLearned: 1000 };
    const results = checkAchievements(stats);
    const vocab = results.find((r) => r.code === "vocab_learner");
    expect(vocab?.tier).toBe("platinum");
  });

  it("星耀等级门槛正确", () => {
    const stats = { ...emptyStats, totalWordsLearned: 3500 };
    const results = checkAchievements(stats);
    const vocab = results.find((r) => r.code === "vocab_learner");
    expect(vocab?.tier).toBe("star");
  });
});

describe("findNewUnlocks", () => {
  it("应该找出新解锁的成就", () => {
    const old = [
      {
        code: "vocab_learner",
        name: "词汇新手",
        tier: "none" as const,
        progress: 0,
        maxForCurrentTier: 50,
      },
    ];
    const newR = [
      {
        code: "vocab_learner",
        name: "词汇新手",
        tier: "bronze" as const,
        progress: 50,
        maxForCurrentTier: 200,
      },
    ];
    const unlocks = findNewUnlocks(old, newR);
    expect(unlocks).toHaveLength(1);
    expect(unlocks[0].code).toBe("vocab_learner");
  });

  it("等级不变时不应返回", () => {
    const old = [
      {
        code: "vocab_learner",
        name: "词汇新手",
        tier: "bronze" as const,
        progress: 50,
        maxForCurrentTier: 200,
      },
    ];
    const newR = [
      {
        code: "vocab_learner",
        name: "词汇新手",
        tier: "bronze" as const,
        progress: 100,
        maxForCurrentTier: 200,
      },
    ];
    const unlocks = findNewUnlocks(old, newR);
    expect(unlocks).toHaveLength(0);
  });

  it("从黄金升到铂金应检测到", () => {
    const old = [
      {
        code: "vocab_learner",
        name: "词汇新手",
        tier: "gold" as const,
        progress: 500,
        maxForCurrentTier: 1000,
      },
    ];
    const newR = [
      {
        code: "vocab_learner",
        name: "词汇新手",
        tier: "platinum" as const,
        progress: 1000,
        maxForCurrentTier: 2000,
      },
    ];
    const unlocks = findNewUnlocks(old, newR);
    expect(unlocks).toHaveLength(1);
    expect(unlocks[0].tier).toBe("platinum");
  });

  it("从星耀升到王者应检测到", () => {
    const old = [
      {
        code: "vocab_learner",
        name: "词汇新手",
        tier: "star" as const,
        progress: 3500,
        maxForCurrentTier: 5000,
      },
    ];
    const newR = [
      {
        code: "vocab_learner",
        name: "词汇新手",
        tier: "king" as const,
        progress: 5000,
        maxForCurrentTier: 5000,
      },
    ];
    const unlocks = findNewUnlocks(old, newR);
    expect(unlocks).toHaveLength(1);
    expect(unlocks[0].tier).toBe("king");
  });
});
