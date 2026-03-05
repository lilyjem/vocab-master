/**
 * SM-2 间隔重复算法测试
 */
import {
  calculateSM2,
  getWordStatus,
  SM2_DEFAULTS,
  QUALITY_LABELS,
  type SM2Params,
} from "../sm2";

describe("SM2_DEFAULTS", () => {
  test("初始参数为零重复、2.5难度因子、零间隔", () => {
    expect(SM2_DEFAULTS.repetitions).toBe(0);
    expect(SM2_DEFAULTS.easinessFactor).toBe(2.5);
    expect(SM2_DEFAULTS.interval).toBe(0);
  });
});

describe("calculateSM2", () => {
  // ===== 评分低于3（未记住）的行为 =====

  test("评分0时重置重复次数为0，间隔设为1天", () => {
    const result = calculateSM2(0, SM2_DEFAULTS);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  test("评分1时重置重复次数为0，间隔设为1天", () => {
    const result = calculateSM2(1, SM2_DEFAULTS);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  test("评分2时重置重复次数为0，间隔设为1天", () => {
    const result = calculateSM2(2, SM2_DEFAULTS);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  test("已学习多次后评分低，仍然重置", () => {
    const prev: SM2Params = { repetitions: 5, easinessFactor: 2.5, interval: 30 };
    const result = calculateSM2(1, prev);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  // ===== 评分>=3（记住了）的行为 =====

  test("新单词首次评分3，间隔设为1天，重复次数为1", () => {
    const result = calculateSM2(3, SM2_DEFAULTS);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  test("新单词首次评分5，间隔设为1天，重复次数为1", () => {
    const result = calculateSM2(5, SM2_DEFAULTS);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  test("第二次正确评分，间隔设为6天", () => {
    const prev: SM2Params = { repetitions: 1, easinessFactor: 2.5, interval: 1 };
    const result = calculateSM2(4, prev);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  test("第三次及以后正确评分，间隔按 interval * EF 增长", () => {
    const prev: SM2Params = { repetitions: 2, easinessFactor: 2.5, interval: 6 };
    const result = calculateSM2(4, prev);
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(Math.round(6 * 2.5));
  });

  // ===== 难度因子（EF）更新 =====

  test("评分5时难度因子增加", () => {
    const result = calculateSM2(5, SM2_DEFAULTS);
    expect(result.easinessFactor).toBeGreaterThan(SM2_DEFAULTS.easinessFactor);
  });

  test("评分0时难度因子降低", () => {
    const result = calculateSM2(0, SM2_DEFAULTS);
    expect(result.easinessFactor).toBeLessThan(SM2_DEFAULTS.easinessFactor);
  });

  test("难度因子最低不低于1.3", () => {
    // 连续给低分以压低 EF
    let prev: SM2Params = { repetitions: 0, easinessFactor: 1.4, interval: 0 };
    const result = calculateSM2(0, prev);
    expect(result.easinessFactor).toBeGreaterThanOrEqual(1.3);
  });

  test("极端低分连续后 EF 不会低于1.3", () => {
    let params: SM2Params = { ...SM2_DEFAULTS };
    for (let i = 0; i < 20; i++) {
      const result = calculateSM2(0, params);
      params = {
        repetitions: result.repetitions,
        easinessFactor: result.easinessFactor,
        interval: result.interval,
      };
    }
    expect(params.easinessFactor).toBeGreaterThanOrEqual(1.3);
  });

  // ===== 下次复习日期 =====

  test("返回的 nextReviewDate 是未来的日期", () => {
    const result = calculateSM2(4, SM2_DEFAULTS);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(result.nextReviewDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  test("nextReviewDate 的时间部分被归零", () => {
    const result = calculateSM2(3, SM2_DEFAULTS);
    expect(result.nextReviewDate.getHours()).toBe(0);
    expect(result.nextReviewDate.getMinutes()).toBe(0);
    expect(result.nextReviewDate.getSeconds()).toBe(0);
    expect(result.nextReviewDate.getMilliseconds()).toBe(0);
  });

  // ===== 评分范围限制 =====

  test("评分超过5时被限制为5", () => {
    const result = calculateSM2(10, SM2_DEFAULTS);
    // 应当和评分5的行为一致
    const result5 = calculateSM2(5, SM2_DEFAULTS);
    expect(result.repetitions).toBe(result5.repetitions);
    expect(result.interval).toBe(result5.interval);
  });

  test("评分低于0时被限制为0", () => {
    const result = calculateSM2(-5, SM2_DEFAULTS);
    const result0 = calculateSM2(0, SM2_DEFAULTS);
    expect(result.repetitions).toBe(result0.repetitions);
    expect(result.interval).toBe(result0.interval);
  });

  test("小数评分被四舍五入", () => {
    const result = calculateSM2(4.7, SM2_DEFAULTS);
    const result5 = calculateSM2(5, SM2_DEFAULTS);
    expect(result.repetitions).toBe(result5.repetitions);
    expect(result.interval).toBe(result5.interval);
  });

  // ===== 完整学习路径模拟 =====

  test("模拟完整学习路径：连续高分导致间隔持续增长", () => {
    let params: SM2Params = { ...SM2_DEFAULTS };
    const intervals: number[] = [];

    for (let i = 0; i < 6; i++) {
      const result = calculateSM2(5, params);
      intervals.push(result.interval);
      params = {
        repetitions: result.repetitions,
        easinessFactor: result.easinessFactor,
        interval: result.interval,
      };
    }

    // 第一次: 1天, 第二次: 6天, 之后持续增长
    expect(intervals[0]).toBe(1);
    expect(intervals[1]).toBe(6);
    for (let i = 2; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    }
  });

  test("模拟学习路径：中途忘记后重置", () => {
    // 先连续正确3次
    let params: SM2Params = { ...SM2_DEFAULTS };
    for (let i = 0; i < 3; i++) {
      const result = calculateSM2(5, params);
      params = {
        repetitions: result.repetitions,
        easinessFactor: result.easinessFactor,
        interval: result.interval,
      };
    }
    expect(params.repetitions).toBe(3);
    expect(params.interval).toBeGreaterThan(6);

    // 然后评分低，应该重置
    const afterFail = calculateSM2(1, params);
    expect(afterFail.repetitions).toBe(0);
    expect(afterFail.interval).toBe(1);
  });
});

describe("getWordStatus", () => {
  test("新单词（初始参数）返回 'new'", () => {
    expect(getWordStatus(SM2_DEFAULTS)).toBe("new");
  });

  test("repetitions=0 且 interval=0 返回 'new'", () => {
    expect(getWordStatus({ repetitions: 0, easinessFactor: 2.5, interval: 0 })).toBe("new");
  });

  test("repetitions=0 但 interval>0（忘记过）返回 'learning'", () => {
    // 评分低后 repetitions=0 但 interval=1
    expect(getWordStatus({ repetitions: 0, easinessFactor: 2.0, interval: 1 })).toBe("learning");
  });

  test("repetitions=1 返回 'learning'", () => {
    expect(getWordStatus({ repetitions: 1, easinessFactor: 2.5, interval: 1 })).toBe("learning");
  });

  test("repetitions=2 且 interval<21 返回 'review'", () => {
    expect(getWordStatus({ repetitions: 2, easinessFactor: 2.5, interval: 6 })).toBe("review");
  });

  test("repetitions=3 且 interval=20 返回 'review'", () => {
    expect(getWordStatus({ repetitions: 3, easinessFactor: 2.5, interval: 20 })).toBe("review");
  });

  test("interval>=21 返回 'mastered'", () => {
    expect(getWordStatus({ repetitions: 3, easinessFactor: 2.5, interval: 21 })).toBe("mastered");
  });

  test("interval=100 返回 'mastered'", () => {
    expect(getWordStatus({ repetitions: 5, easinessFactor: 2.5, interval: 100 })).toBe("mastered");
  });
});

describe("QUALITY_LABELS", () => {
  test("包含0-5所有评分等级", () => {
    for (let i = 0; i <= 5; i++) {
      expect(QUALITY_LABELS[i]).toBeDefined();
      expect(QUALITY_LABELS[i].label).toBeTruthy();
      expect(QUALITY_LABELS[i].color).toBeTruthy();
      expect(QUALITY_LABELS[i].description).toBeTruthy();
    }
  });

  test("评分越高颜色应从红色系过渡到绿色系", () => {
    // 评分0的颜色应包含红色
    expect(QUALITY_LABELS[0].color).toMatch(/#[ef]/i);
    // 评分5的颜色应包含绿色
    expect(QUALITY_LABELS[5].color).toMatch(/#1/);
  });
});
