/**
 * 登录失败限流器
 * 同一邮箱 5 次失败后锁定 15 分钟
 */

// 简单的内存存储（与 MemoryCache 类似但更简单）
const failedAttempts = new Map<string, { count: number; lockedUntil?: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 分钟

/** 检查是否被锁定，返回 { locked, remainingMinutes, remainingAttempts } */
export function checkLoginLimit(email: string): {
  locked: boolean;
  remainingMinutes: number;
  remainingAttempts: number;
} {
  const key = email.toLowerCase();
  const record = failedAttempts.get(key);

  if (!record) {
    return { locked: false, remainingMinutes: 0, remainingAttempts: MAX_ATTEMPTS };
  }

  // 检查锁定是否过期
  if (record.lockedUntil) {
    if (Date.now() < record.lockedUntil) {
      const remainingMs = record.lockedUntil - Date.now();
      return {
        locked: true,
        remainingMinutes: Math.ceil(remainingMs / 60000),
        remainingAttempts: 0,
      };
    }
    // 锁定已过期，重置
    failedAttempts.delete(key);
    return { locked: false, remainingMinutes: 0, remainingAttempts: MAX_ATTEMPTS };
  }

  return {
    locked: false,
    remainingMinutes: 0,
    remainingAttempts: MAX_ATTEMPTS - record.count,
  };
}

/** 记录一次登录失败 */
export function recordFailedLogin(email: string): void {
  const key = email.toLowerCase();
  const record = failedAttempts.get(key) || { count: 0 };
  record.count++;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_DURATION_MS;
  }

  failedAttempts.set(key, record);
}

/** 登录成功后清除失败记录 */
export function clearFailedLogins(email: string): void {
  failedAttempts.delete(email.toLowerCase());
}
