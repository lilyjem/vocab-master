/**
 * 内存缓存 - 基于 Map 的 TTL 过期缓存
 * 用于 API 响应的短期缓存，减轻数据库压力
 */

/** 缓存条目结构：存储值与过期时间戳 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  /**
   * 获取缓存值，若已过期则返回 undefined
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * 设置缓存，指定 TTL 毫秒数
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  /** 删除指定 key */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** 清空所有缓存 */
  clear(): void {
    this.store.clear();
  }
}

/** 全局单例，供 API 路由使用 */
export const apiCache = new MemoryCache();

/** 5 分钟 TTL（词库列表） */
export const TTL_BOOKS_MS = 5 * 60 * 1000;

/** 10 分钟 TTL（单词数据） */
export const TTL_WORDS_MS = 10 * 60 * 1000;
