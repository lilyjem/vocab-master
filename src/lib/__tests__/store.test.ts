/**
 * Zustand Store 测试
 * 测试本地学习数据管理的核心逻辑
 */

// 模拟 localStorage（Node.js 中不存在）
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

import { useLearningStore } from "../store";
import { DEFAULT_SETTINGS } from "@/types";
import { formatDate, getToday } from "@/lib/utils";

/** 每个测试前重置 store */
beforeEach(() => {
  localStorageMock.clear();
  useLearningStore.setState({
    currentBookId: null,
    wordProgress: {},
    sessions: [],
    dailyStats: {},
    settings: DEFAULT_SETTINGS,
    localAchievements: {},
  });
});

describe("Store 初始状态", () => {
  test("currentBookId 初始为 null", () => {
    expect(useLearningStore.getState().currentBookId).toBeNull();
  });

  test("wordProgress 初始为空对象", () => {
    expect(useLearningStore.getState().wordProgress).toEqual({});
  });

  test("sessions 初始为空数组", () => {
    expect(useLearningStore.getState().sessions).toEqual([]);
  });

  test("settings 使用默认设置", () => {
    expect(useLearningStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe("setCurrentBook", () => {
  test("设置当前词库 ID", () => {
    useLearningStore.getState().setCurrentBook("book-1");
    expect(useLearningStore.getState().currentBookId).toBe("book-1");
  });

  test("切换词库 ID", () => {
    useLearningStore.getState().setCurrentBook("book-1");
    useLearningStore.getState().setCurrentBook("book-2");
    expect(useLearningStore.getState().currentBookId).toBe("book-2");
  });
});

describe("updateWordProgress", () => {
  test("新词首次学习后创建进度记录", () => {
    useLearningStore.getState().updateWordProgress("word-1", 4);
    const progress = useLearningStore.getState().wordProgress["word-1"];

    expect(progress).toBeDefined();
    expect(progress.wordId).toBe("word-1");
    expect(progress.totalReviews).toBe(1);
    expect(progress.correctCount).toBe(1);
  });

  test("评分>=3 计入 correctCount", () => {
    useLearningStore.getState().updateWordProgress("word-1", 3);
    expect(useLearningStore.getState().wordProgress["word-1"].correctCount).toBe(1);
  });

  test("评分<3 不计入 correctCount", () => {
    useLearningStore.getState().updateWordProgress("word-1", 2);
    expect(useLearningStore.getState().wordProgress["word-1"].correctCount).toBe(0);
  });

  test("多次学习 totalReviews 累加", () => {
    const store = useLearningStore.getState();
    store.updateWordProgress("word-1", 4);
    store.updateWordProgress("word-1", 5);
    store.updateWordProgress("word-1", 2);

    const progress = useLearningStore.getState().wordProgress["word-1"];
    expect(progress.totalReviews).toBe(3);
    expect(progress.correctCount).toBe(2); // 4和5算对，2算错
  });

  test("新词学习更新今日 wordsLearned 统计", () => {
    useLearningStore.getState().updateWordProgress("word-1", 4);
    const today = formatDate(getToday());
    const stats = useLearningStore.getState().dailyStats[today];
    expect(stats.wordsLearned).toBe(1);
    expect(stats.wordsReviewed).toBe(0);
  });

  test("已学过的词复习更新 wordsReviewed 统计", () => {
    // 先学一次（算新词）
    useLearningStore.getState().updateWordProgress("word-1", 4);
    // 再学一次（算复习）
    useLearningStore.getState().updateWordProgress("word-1", 4);

    const today = formatDate(getToday());
    const stats = useLearningStore.getState().dailyStats[today];
    expect(stats.wordsLearned).toBe(1);
    expect(stats.wordsReviewed).toBe(1);
  });

  test("进度中的 nextReviewDate 是有效的 ISO 字符串", () => {
    useLearningStore.getState().updateWordProgress("word-1", 4);
    const progress = useLearningStore.getState().wordProgress["word-1"];
    expect(() => new Date(progress.nextReviewDate)).not.toThrow();
    expect(new Date(progress.nextReviewDate).toISOString()).toBe(progress.nextReviewDate);
  });

  test("进度中的 status 是有效的 WordStatus", () => {
    useLearningStore.getState().updateWordProgress("word-1", 4);
    const progress = useLearningStore.getState().wordProgress["word-1"];
    expect(["new", "learning", "review", "mastered"]).toContain(progress.status);
  });
});

describe("getWordProgress", () => {
  test("不存在的单词返回 undefined", () => {
    expect(useLearningStore.getState().getWordProgress("nonexistent")).toBeUndefined();
  });

  test("已学习的单词返回进度", () => {
    useLearningStore.getState().updateWordProgress("word-1", 4);
    const progress = useLearningStore.getState().getWordProgress("word-1");
    expect(progress).toBeDefined();
    expect(progress!.wordId).toBe("word-1");
  });
});

describe("getNewWordIds", () => {
  test("所有单词都是新词时全部返回", () => {
    const bookWordIds = ["w1", "w2", "w3"];
    const result = useLearningStore.getState().getNewWordIds(bookWordIds, 10);
    expect(result).toEqual(["w1", "w2", "w3"]);
  });

  test("已学习的单词不出现在新词列表中", () => {
    useLearningStore.getState().updateWordProgress("w2", 4);
    const result = useLearningStore.getState().getNewWordIds(["w1", "w2", "w3"], 10);
    expect(result).toEqual(["w1", "w3"]);
  });

  test("limit 参数限制返回数量", () => {
    const result = useLearningStore.getState().getNewWordIds(["w1", "w2", "w3", "w4", "w5"], 2);
    expect(result.length).toBe(2);
  });

  test("空词库返回空数组", () => {
    const result = useLearningStore.getState().getNewWordIds([], 10);
    expect(result).toEqual([]);
  });
});

describe("getReviewWordIds", () => {
  test("没有任何进度时返回空数组", () => {
    const result = useLearningStore.getState().getReviewWordIds(["w1", "w2"], 10);
    expect(result).toEqual([]);
  });

  test("到期且非new状态的单词出现在复习列表", () => {
    // 手动设置一个到期的进度
    useLearningStore.setState({
      wordProgress: {
        "w1": {
          wordId: "w1",
          repetitions: 1,
          easinessFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(Date.now() - 86400000).toISOString(), // 昨天到期
          totalReviews: 1,
          correctCount: 1,
          status: "learning",
        },
      },
    });

    const result = useLearningStore.getState().getReviewWordIds(["w1", "w2"], 10);
    expect(result).toContain("w1");
    expect(result).not.toContain("w2");
  });

  test("未到期的单词不出现在复习列表", () => {
    useLearningStore.setState({
      wordProgress: {
        "w1": {
          wordId: "w1",
          repetitions: 1,
          easinessFactor: 2.5,
          interval: 30,
          nextReviewDate: new Date(Date.now() + 86400000 * 30).toISOString(), // 30天后到期
          totalReviews: 1,
          correctCount: 1,
          status: "learning",
        },
      },
    });

    const result = useLearningStore.getState().getReviewWordIds(["w1"], 10);
    expect(result).toEqual([]);
  });

  test("limit 参数限制返回数量", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    useLearningStore.setState({
      wordProgress: {
        "w1": { wordId: "w1", repetitions: 1, easinessFactor: 2.5, interval: 1, nextReviewDate: yesterday, totalReviews: 1, correctCount: 1, status: "learning" },
        "w2": { wordId: "w2", repetitions: 1, easinessFactor: 2.5, interval: 1, nextReviewDate: yesterday, totalReviews: 1, correctCount: 1, status: "learning" },
        "w3": { wordId: "w3", repetitions: 1, easinessFactor: 2.5, interval: 1, nextReviewDate: yesterday, totalReviews: 1, correctCount: 1, status: "review" },
      },
    });

    const result = useLearningStore.getState().getReviewWordIds(["w1", "w2", "w3"], 2);
    expect(result.length).toBe(2);
  });
});

describe("getTodayStats", () => {
  test("无数据时返回零统计", () => {
    const stats = useLearningStore.getState().getTodayStats();
    expect(stats.wordsLearned).toBe(0);
    expect(stats.wordsReviewed).toBe(0);
    expect(stats.studyMinutes).toBe(0);
  });

  test("学习后统计更新", () => {
    useLearningStore.getState().updateWordProgress("w1", 4);
    useLearningStore.getState().updateWordProgress("w2", 5);

    const stats = useLearningStore.getState().getTodayStats();
    expect(stats.wordsLearned).toBe(2);
  });
});

describe("getStreak", () => {
  test("无数据时连续天数为0", () => {
    expect(useLearningStore.getState().getStreak()).toBe(0);
  });

  test("今天有学习记录，连续天数为1", () => {
    useLearningStore.getState().updateWordProgress("w1", 4);
    expect(useLearningStore.getState().getStreak()).toBe(1);
  });

  test("连续多天有记录，正确计算连续天数", () => {
    const today = getToday();
    const dailyStats: Record<string, { date: string; wordsLearned: number; wordsReviewed: number; studyMinutes: number }> = {};

    // 连续3天有学习记录
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatDate(d);
      dailyStats[key] = { date: key, wordsLearned: 5, wordsReviewed: 3, studyMinutes: 10 };
    }

    useLearningStore.setState({ dailyStats });
    expect(useLearningStore.getState().getStreak()).toBe(3);
  });

  test("中间有一天断了，只算后面的连续天数", () => {
    const today = getToday();
    const dailyStats: Record<string, { date: string; wordsLearned: number; wordsReviewed: number; studyMinutes: number }> = {};

    // 今天和昨天有记录
    for (let i = 0; i < 2; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatDate(d);
      dailyStats[key] = { date: key, wordsLearned: 5, wordsReviewed: 0, studyMinutes: 5 };
    }
    // 前天没有记录（跳过）
    // 大前天有记录
    const d3 = new Date(today);
    d3.setDate(d3.getDate() - 3);
    dailyStats[formatDate(d3)] = { date: formatDate(d3), wordsLearned: 5, wordsReviewed: 0, studyMinutes: 5 };

    useLearningStore.setState({ dailyStats });
    expect(useLearningStore.getState().getStreak()).toBe(2);
  });
});

describe("getWordStatusCounts", () => {
  test("全部新词时 new 计数等于单词数", () => {
    const result = useLearningStore.getState().getWordStatusCounts(["w1", "w2", "w3"]);
    expect(result).toEqual({ new: 3, learning: 0, review: 0, mastered: 0 });
  });

  test("混合状态时正确统计", () => {
    useLearningStore.setState({
      wordProgress: {
        "w1": { wordId: "w1", repetitions: 1, easinessFactor: 2.5, interval: 1, nextReviewDate: "", totalReviews: 1, correctCount: 1, status: "learning" },
        "w2": { wordId: "w2", repetitions: 3, easinessFactor: 2.5, interval: 21, nextReviewDate: "", totalReviews: 3, correctCount: 3, status: "mastered" },
      },
    });

    const result = useLearningStore.getState().getWordStatusCounts(["w1", "w2", "w3"]);
    expect(result.learning).toBe(1);
    expect(result.mastered).toBe(1);
    expect(result.new).toBe(1);
  });
});

describe("addSession", () => {
  test("添加学习会话", () => {
    useLearningStore.getState().addSession({
      mode: "learn",
      bookId: "book-1",
      startTime: new Date().toISOString(),
      newWordsCount: 10,
      reviewWordsCount: 0,
      correctCount: 8,
      totalCount: 10,
    });

    expect(useLearningStore.getState().sessions.length).toBe(1);
    expect(useLearningStore.getState().sessions[0].mode).toBe("learn");
  });

  test("未提供 endTime 时自动填充", () => {
    useLearningStore.getState().addSession({
      mode: "review",
      startTime: new Date().toISOString(),
      newWordsCount: 0,
      reviewWordsCount: 5,
      correctCount: 4,
      totalCount: 5,
    });

    expect(useLearningStore.getState().sessions[0].endTime).toBeTruthy();
  });

  test("最多保留100条会话记录", () => {
    for (let i = 0; i < 110; i++) {
      useLearningStore.getState().addSession({
        mode: "quiz",
        startTime: new Date().toISOString(),
        newWordsCount: 0,
        reviewWordsCount: 0,
        correctCount: 0,
        totalCount: 0,
      });
    }

    expect(useLearningStore.getState().sessions.length).toBeLessThanOrEqual(100);
  });
});

describe("updateSettings", () => {
  test("部分更新设置", () => {
    useLearningStore.getState().updateSettings({ dailyNewWords: 30 });
    const settings = useLearningStore.getState().settings;
    expect(settings.dailyNewWords).toBe(30);
    expect(settings.dailyReviewWords).toBe(DEFAULT_SETTINGS.dailyReviewWords);
  });

  test("多次更新不丢失其他设置", () => {
    useLearningStore.getState().updateSettings({ dailyNewWords: 30 });
    useLearningStore.getState().updateSettings({ autoPlayAudio: false });

    const settings = useLearningStore.getState().settings;
    expect(settings.dailyNewWords).toBe(30);
    expect(settings.autoPlayAudio).toBe(false);
    expect(settings.showPhonetic).toBe(DEFAULT_SETTINGS.showPhonetic);
  });
});

describe("clearAllData", () => {
  test("清空所有数据重置到初始状态", () => {
    // 先添加一些数据
    useLearningStore.getState().setCurrentBook("book-1");
    useLearningStore.getState().updateWordProgress("w1", 4);
    useLearningStore.getState().updateSettings({ dailyNewWords: 50 });

    // 清空
    useLearningStore.getState().clearAllData();

    const state = useLearningStore.getState();
    expect(state.currentBookId).toBeNull();
    expect(state.wordProgress).toEqual({});
    expect(state.sessions).toEqual([]);
    expect(state.dailyStats).toEqual({});
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe("exportData", () => {
  test("导出的数据是有效的 JSON 字符串", () => {
    useLearningStore.getState().setCurrentBook("book-1");
    useLearningStore.getState().updateWordProgress("w1", 4);

    const exported = useLearningStore.getState().exportData();
    const parsed = JSON.parse(exported);

    expect(parsed.currentBookId).toBe("book-1");
    expect(parsed.wordProgress).toBeDefined();
    expect(parsed.exportedAt).toBeTruthy();
  });

  test("导出数据包含所有必要字段", () => {
    const exported = JSON.parse(useLearningStore.getState().exportData());
    expect(exported).toHaveProperty("currentBookId");
    expect(exported).toHaveProperty("wordProgress");
    expect(exported).toHaveProperty("sessions");
    expect(exported).toHaveProperty("dailyStats");
    expect(exported).toHaveProperty("settings");
    expect(exported).toHaveProperty("exportedAt");
  });
});
