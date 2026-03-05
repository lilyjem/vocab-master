/**
 * 输入验证工具函数
 * 从 API 路由提取出的纯函数验证逻辑，便于测试
 */

/** 注册参数验证结果 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** 验证注册参数 */
export function validateRegistration(data: {
  email?: string;
  password?: string;
  name?: string;
}): ValidationResult {
  if (!data.email || !data.password) {
    return { valid: false, error: "邮箱和密码不能为空" };
  }

  if (!isValidEmail(data.email)) {
    return { valid: false, error: "邮箱格式不正确" };
  }

  if (data.password.length < 6) {
    return { valid: false, error: "密码长度至少为6位" };
  }

  return { valid: true };
}

/** 验证邮箱格式 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/** 从邮箱地址中提取用户名（注册时若未提供 name 则使用） */
export function extractNameFromEmail(email: string): string {
  return email.split("@")[0];
}

/** 验证词库 JSON 数据结构 */
export function validateSeedData(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "数据不是有效的对象" };
  }

  const d = data as Record<string, unknown>;

  if (!d.book || typeof d.book !== "object") {
    return { valid: false, error: "缺少 book 字段" };
  }

  const book = d.book as Record<string, unknown>;
  const requiredBookFields = ["name", "description", "level", "category", "coverColor", "sortOrder"];
  for (const field of requiredBookFields) {
    if (book[field] === undefined || book[field] === null) {
      return { valid: false, error: `book 缺少字段: ${field}` };
    }
  }

  if (!Array.isArray(d.words)) {
    return { valid: false, error: "words 不是数组" };
  }

  if (d.words.length === 0) {
    return { valid: false, error: "words 数组为空" };
  }

  for (let i = 0; i < d.words.length; i++) {
    const word = d.words[i] as Record<string, unknown>;
    if (!word.word || typeof word.word !== "string") {
      return { valid: false, error: `words[${i}] 缺少 word 字段` };
    }
    if (!word.definition || typeof word.definition !== "string") {
      return { valid: false, error: `words[${i}] 缺少 definition 字段` };
    }
    if (typeof word.difficulty !== "number" || word.difficulty < 1 || word.difficulty > 5) {
      return { valid: false, error: `words[${i}] difficulty 无效（应为1-5）` };
    }
  }

  return { valid: true };
}
