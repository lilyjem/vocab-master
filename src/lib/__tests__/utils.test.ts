/**
 * 通用工具函数测试
 */
import {
  formatDate,
  formatDateCN,
  daysBetween,
  getToday,
  percentage,
  shuffle,
  sampleArray,
} from "../utils";

describe("formatDate", () => {
  test("将日期格式化为 YYYY-MM-DD", () => {
    const date = new Date("2024-03-15T10:30:00Z");
    expect(formatDate(date)).toBe("2024-03-15");
  });

  test("月份和日期正确补零", () => {
    const date = new Date("2024-01-05T00:00:00Z");
    expect(formatDate(date)).toBe("2024-01-05");
  });

  test("年末日期格式正确", () => {
    const date = new Date("2024-12-31T23:59:59Z");
    expect(formatDate(date)).toBe("2024-12-31");
  });
});

describe("formatDateCN", () => {
  test("将日期格式化为中文显示", () => {
    const date = new Date(2024, 2, 15); // 2024年3月15日（月份从0开始）
    expect(formatDateCN(date)).toBe("2024年3月15日");
  });

  test("1月1日格式正确", () => {
    const date = new Date(2024, 0, 1);
    expect(formatDateCN(date)).toBe("2024年1月1日");
  });

  test("12月31日格式正确", () => {
    const date = new Date(2024, 11, 31);
    expect(formatDateCN(date)).toBe("2024年12月31日");
  });
});

describe("daysBetween", () => {
  test("同一天返回0", () => {
    const date = new Date("2024-03-15");
    expect(daysBetween(date, date)).toBe(0);
  });

  test("相邻两天返回1", () => {
    const d1 = new Date("2024-03-15");
    const d2 = new Date("2024-03-16");
    expect(daysBetween(d1, d2)).toBe(1);
  });

  test("参数顺序不影响结果（取绝对值）", () => {
    const d1 = new Date("2024-03-15");
    const d2 = new Date("2024-03-20");
    expect(daysBetween(d1, d2)).toBe(5);
    expect(daysBetween(d2, d1)).toBe(5);
  });

  test("跨月天数计算正确", () => {
    const d1 = new Date("2024-01-01");
    const d2 = new Date("2024-02-01");
    expect(daysBetween(d1, d2)).toBe(31);
  });

  test("跨年天数计算正确", () => {
    const d1 = new Date("2024-01-01");
    const d2 = new Date("2025-01-01");
    expect(daysBetween(d1, d2)).toBe(366); // 2024是闰年
  });
});

describe("getToday", () => {
  test("返回今天的日期", () => {
    const today = getToday();
    const now = new Date();
    expect(today.getFullYear()).toBe(now.getFullYear());
    expect(today.getMonth()).toBe(now.getMonth());
    expect(today.getDate()).toBe(now.getDate());
  });

  test("时间部分归零", () => {
    const today = getToday();
    expect(today.getHours()).toBe(0);
    expect(today.getMinutes()).toBe(0);
    expect(today.getSeconds()).toBe(0);
    expect(today.getMilliseconds()).toBe(0);
  });
});

describe("percentage", () => {
  test("计算百分比并取整", () => {
    expect(percentage(1, 3)).toBe(33);
    expect(percentage(2, 3)).toBe(67);
    expect(percentage(1, 1)).toBe(100);
  });

  test("0/0 返回 0（不会除以零）", () => {
    expect(percentage(0, 0)).toBe(0);
  });

  test("total为0时返回0", () => {
    expect(percentage(5, 0)).toBe(0);
  });

  test("value为0时返回0", () => {
    expect(percentage(0, 100)).toBe(0);
  });

  test("value等于total时返回100", () => {
    expect(percentage(50, 50)).toBe(100);
  });
});

describe("shuffle", () => {
  test("返回新数组不修改原数组", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(original);
    expect(original).toEqual(copy);
  });

  test("返回的数组长度与原数组相同", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr).length).toBe(arr.length);
  });

  test("返回的数组包含所有原始元素", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  test("空数组返回空数组", () => {
    expect(shuffle([])).toEqual([]);
  });

  test("单元素数组返回相同数组", () => {
    expect(shuffle([1])).toEqual([1]);
  });

  test("多次 shuffle 产生不同顺序（统计检验）", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let sameOrderCount = 0;

    for (let i = 0; i < 20; i++) {
      const shuffled = shuffle(arr);
      if (JSON.stringify(shuffled) === JSON.stringify(arr)) {
        sameOrderCount++;
      }
    }

    // 20次中不应该全部与原始顺序相同
    expect(sameOrderCount).toBeLessThan(20);
  });
});

describe("sampleArray", () => {
  test("返回指定数量的元素", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const sample = sampleArray(arr, 3);
    expect(sample.length).toBe(3);
  });

  test("返回的元素都来自原数组", () => {
    const arr = [1, 2, 3, 4, 5];
    const sample = sampleArray(arr, 3);
    sample.forEach((item) => {
      expect(arr).toContain(item);
    });
  });

  test("n大于数组长度时返回全部元素", () => {
    const arr = [1, 2, 3];
    const sample = sampleArray(arr, 10);
    expect(sample.length).toBe(3);
  });

  test("n为0时返回空数组", () => {
    expect(sampleArray([1, 2, 3], 0)).toEqual([]);
  });

  test("不修改原数组", () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    sampleArray(arr, 3);
    expect(arr).toEqual(copy);
  });
});
