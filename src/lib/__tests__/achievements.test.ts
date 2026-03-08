import { describe, it, expect } from "@jest/globals";
import {
  calculateTier,
  checkAchievements,
  findNewUnlocks,
} from "../achievements";
import type { AchievementStats } from "../achievements";

describe("calculateTier", () => {
  it("进度不足时返回 none", () => {
    expect(calculateTier(0, 50, 500, 2000)).toBe("none");
    expect(calculateTier(49, 50, 500, 2000)).toBe("none");
  });

  it("达到铜牌阈值返回 bronze", () => {
    expect(calculateTier(50, 50, 500, 2000)).toBe("bronze");
    expect(calculateTier(499, 50, 500, 2000)).toBe("bronze");
  });

  it("达到银牌阈值返回 silver", () => {
    expect(calculateTier(500, 50, 500, 2000)).toBe("silver");
    expect(calculateTier(1999, 50, 500, 2000)).toBe("silver");
  });

  it("达到金牌阈值返回 gold", () => {
    expect(calculateTier(2000, 50, 500, 2000)).toBe("gold");
    expect(calculateTier(9999, 50, 500, 2000)).toBe("gold");
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

  it("学习 50 词应解锁词汇新手铜牌", () => {
    const stats = { ...emptyStats, totalWordsLearned: 50 };
    const results = checkAchievements(stats);
    const vocab = results.find((r) => r.code === "vocab_learner");
    expect(vocab?.tier).toBe("bronze");
    expect(vocab?.progress).toBe(50);
  });

  it("连续打卡 14 天应解锁坚持不懈银牌", () => {
    const stats = { ...emptyStats, currentStreak: 14 };
    const results = checkAchievements(stats);
    const streak = results.find((r) => r.code === "streak_master");
    expect(streak?.tier).toBe("silver");
  });

  it("多个成就可以同时解锁", () => {
    const stats = {
      ...emptyStats,
      totalWordsLearned: 2000,
      currentStreak: 30,
      totalStudyMinutes: 3000,
    };
    const results = checkAchievements(stats);
    const gold = results.filter((r) => r.tier === "gold");
    expect(gold.length).toBe(3);
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
        maxForCurrentTier: 500,
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
        maxForCurrentTier: 500,
      },
    ];
    const newR = [
      {
        code: "vocab_learner",
        name: "词汇新手",
        tier: "bronze" as const,
        progress: 100,
        maxForCurrentTier: 500,
      },
    ];
    const unlocks = findNewUnlocks(old, newR);
    expect(unlocks).toHaveLength(0);
  });
});
