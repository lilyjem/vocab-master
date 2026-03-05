/**
 * 输入验证函数测试
 */
import {
  validateRegistration,
  isValidEmail,
  extractNameFromEmail,
  validateSeedData,
} from "../validation";

describe("isValidEmail", () => {
  test("合法邮箱返回 true", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.name@domain.org")).toBe(true);
    expect(isValidEmail("a@b.cc")).toBe(true);
  });

  test("缺少@符号返回 false", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  test("缺少域名返回 false", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  test("缺少用户名返回 false", () => {
    expect(isValidEmail("@example.com")).toBe(false);
  });

  test("空字符串返回 false", () => {
    expect(isValidEmail("")).toBe(false);
  });

  test("包含空格返回 false", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  test("缺少顶级域名返回 false", () => {
    expect(isValidEmail("user@domain")).toBe(false);
  });
});

describe("extractNameFromEmail", () => {
  test("提取@前面的部分", () => {
    expect(extractNameFromEmail("john@example.com")).toBe("john");
  });

  test("复杂用户名正确提取", () => {
    expect(extractNameFromEmail("john.doe@example.com")).toBe("john.doe");
  });

  test("空用户名时返回空字符串", () => {
    expect(extractNameFromEmail("@example.com")).toBe("");
  });
});

describe("validateRegistration", () => {
  test("正确的参数返回 valid: true", () => {
    const result = validateRegistration({
      email: "user@example.com",
      password: "123456",
      name: "Test User",
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("缺少邮箱返回错误", () => {
    const result = validateRegistration({ email: "", password: "123456" });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("邮箱和密码不能为空");
  });

  test("缺少密码返回错误", () => {
    const result = validateRegistration({ email: "user@example.com", password: "" });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("邮箱和密码不能为空");
  });

  test("邮箱和密码都缺少返回错误", () => {
    const result = validateRegistration({ email: "", password: "" });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("邮箱和密码不能为空");
  });

  test("undefined 参数返回错误", () => {
    const result = validateRegistration({});
    expect(result.valid).toBe(false);
  });

  test("邮箱格式不正确返回错误", () => {
    const result = validateRegistration({
      email: "not-an-email",
      password: "123456",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("邮箱格式不正确");
  });

  test("密码少于6位返回错误", () => {
    const result = validateRegistration({
      email: "user@example.com",
      password: "12345",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("密码长度至少为6位");
  });

  test("密码正好6位返回 valid", () => {
    const result = validateRegistration({
      email: "user@example.com",
      password: "123456",
    });
    expect(result.valid).toBe(true);
  });

  test("不提供 name 不影响验证", () => {
    const result = validateRegistration({
      email: "user@example.com",
      password: "123456",
    });
    expect(result.valid).toBe(true);
  });
});

describe("validateSeedData", () => {
  const validData = {
    book: {
      name: "CET-4",
      description: "大学英语四级核心词汇",
      level: "beginner",
      category: "exam",
      coverColor: "#2563eb",
      sortOrder: 1,
    },
    words: [
      {
        word: "abandon",
        phonetic: "/əˈbændən/",
        definition: "放弃；遗弃",
        partOfSpeech: "v.",
        example: "He abandoned his car.",
        exampleTranslation: "他丢弃了他的车。",
        difficulty: 2,
      },
    ],
  };

  test("完整合法数据返回 valid: true", () => {
    const result = validateSeedData(validData);
    expect(result.valid).toBe(true);
  });

  test("null 数据返回错误", () => {
    const result = validateSeedData(null);
    expect(result.valid).toBe(false);
  });

  test("非对象数据返回错误", () => {
    const result = validateSeedData("string");
    expect(result.valid).toBe(false);
  });

  test("缺少 book 字段返回错误", () => {
    const result = validateSeedData({ words: [] });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/book/);
  });

  test("book 缺少必要字段返回错误", () => {
    const result = validateSeedData({
      book: { name: "Test" },
      words: [{ word: "test", definition: "测试", difficulty: 1 }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/book 缺少字段/);
  });

  test("words 不是数组返回错误", () => {
    const result = validateSeedData({
      book: validData.book,
      words: "not-array",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/words/);
  });

  test("words 为空数组返回错误", () => {
    const result = validateSeedData({
      book: validData.book,
      words: [],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/为空/);
  });

  test("单词缺少 word 字段返回错误", () => {
    const result = validateSeedData({
      book: validData.book,
      words: [{ definition: "测试", difficulty: 1 }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/word 字段/);
  });

  test("单词缺少 definition 字段返回错误", () => {
    const result = validateSeedData({
      book: validData.book,
      words: [{ word: "test", difficulty: 1 }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/definition/);
  });

  test("difficulty 超出范围返回错误", () => {
    const result = validateSeedData({
      book: validData.book,
      words: [{ word: "test", definition: "测试", difficulty: 6 }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/difficulty/);
  });

  test("difficulty 为0返回错误", () => {
    const result = validateSeedData({
      book: validData.book,
      words: [{ word: "test", definition: "测试", difficulty: 0 }],
    });
    expect(result.valid).toBe(false);
  });

  test("多个单词中有一个无效时返回错误及索引", () => {
    const result = validateSeedData({
      book: validData.book,
      words: [
        { word: "valid", definition: "有效", difficulty: 1 },
        { word: "", definition: "无效", difficulty: 1 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/words\[1\]/);
  });
});
