/**
 * 种子数据完整性测试
 * 验证所有6个词库 JSON 文件的结构和内容
 */
import * as fs from "fs";
import * as path from "path";
import { validateSeedData } from "@/lib/validation";

const SEED_DIR = path.join(__dirname, "..", "seed");
const SEED_FILES = ["cet4.json", "cet6.json", "postgrad.json", "ielts.json", "toefl.json", "gre.json"];

/** 合法的难度等级 */
const VALID_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_CATEGORIES = ["exam", "general"];

describe("种子数据文件存在性", () => {
  test.each(SEED_FILES)("%s 文件存在", (file) => {
    const filePath = path.join(SEED_DIR, file);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe("种子数据 JSON 格式", () => {
  test.each(SEED_FILES)("%s 是有效的 JSON", (file) => {
    const filePath = path.join(SEED_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(() => JSON.parse(content)).not.toThrow();
  });
});

describe("种子数据结构验证", () => {
  test.each(SEED_FILES)("%s 通过结构验证", (file) => {
    const filePath = path.join(SEED_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const result = validateSeedData(data);
    expect(result.valid).toBe(true);
  });
});

describe("种子数据 book 字段详细验证", () => {
  test.each(SEED_FILES)("%s 的 book.name 是非空字符串", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    expect(typeof data.book.name).toBe("string");
    expect(data.book.name.length).toBeGreaterThan(0);
  });

  test.each(SEED_FILES)("%s 的 level 是合法值", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    expect(VALID_LEVELS).toContain(data.book.level);
  });

  test.each(SEED_FILES)("%s 的 category 是合法值", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    expect(VALID_CATEGORIES).toContain(data.book.category);
  });

  test.each(SEED_FILES)("%s 的 coverColor 是有效的十六进制颜色", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    expect(data.book.coverColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test.each(SEED_FILES)("%s 的 sortOrder 是非负整数", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    expect(Number.isInteger(data.book.sortOrder)).toBe(true);
    expect(data.book.sortOrder).toBeGreaterThanOrEqual(0);
  });
});

describe("种子数据 words 内容验证", () => {
  test.each(SEED_FILES)("%s 的单词数量大于0", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    expect(data.words.length).toBeGreaterThan(0);
  });

  test.each(SEED_FILES)("%s 无重复单词", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    const words = data.words.map((w: { word: string }) => w.word.toLowerCase());
    const uniqueWords = new Set(words);
    expect(uniqueWords.size).toBe(words.length);
  });

  test.each(SEED_FILES)("%s 所有单词的 difficulty 在 1-5 范围内", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    data.words.forEach((w: { difficulty: number }, i: number) => {
      expect(w.difficulty).toBeGreaterThanOrEqual(1);
      expect(w.difficulty).toBeLessThanOrEqual(5);
    });
  });

  test.each(SEED_FILES)("%s 所有单词有英文 word 和中文 definition", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    data.words.forEach((w: { word: string; definition: string }, i: number) => {
      expect(w.word.trim().length).toBeGreaterThan(0);
      expect(w.definition.trim().length).toBeGreaterThan(0);
    });
  });

  test.each(SEED_FILES)("%s 的单词 partOfSpeech 字段键名正确（不是 typo）", (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
    data.words.forEach((w: Record<string, unknown>, i: number) => {
      // 确保没有常见的拼写错误
      expect(w).not.toHaveProperty("partOfSpespeech");
      expect(w).not.toHaveProperty("partofspeech");
      expect(w).not.toHaveProperty("partOfSpeach");
      if (w.partOfSpeech !== undefined) {
        expect(typeof w.partOfSpeech).toBe("string");
      }
    });
  });
});

describe("词库排序顺序唯一性", () => {
  test("所有词库的 sortOrder 不重复", () => {
    const sortOrders: number[] = [];
    SEED_FILES.forEach((file) => {
      const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
      sortOrders.push(data.book.sortOrder);
    });

    const unique = new Set(sortOrders);
    expect(unique.size).toBe(sortOrders.length);
  });

  test("所有词库的 name 不重复", () => {
    const names: string[] = [];
    SEED_FILES.forEach((file) => {
      const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
      names.push(data.book.name);
    });

    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});
