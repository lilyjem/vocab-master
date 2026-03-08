/**
 * 内存缓存测试 - MemoryCache TTL 过期与基本操作
 */
import { MemoryCache } from "../cache";

describe("MemoryCache", () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  describe("get / set", () => {
    test("set 后 get 返回对应值", () => {
      cache.set("key1", { foo: "bar" }, 60000);
      expect(cache.get<{ foo: string }>("key1")).toEqual({ foo: "bar" });
    });

    test("不同 key 互不干扰", () => {
      cache.set("a", 1, 60000);
      cache.set("b", "two", 60000);
      expect(cache.get<number>("a")).toBe(1);
      expect(cache.get<string>("b")).toBe("two");
    });

    test("不存在的 key 返回 undefined", () => {
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    test("可缓存 null、0、false 等 falsy 值", () => {
      cache.set("null", null, 60000);
      cache.set("zero", 0, 60000);
      cache.set("false", false, 60000);
      expect(cache.get<null>("null")).toBe(null);
      expect(cache.get<number>("zero")).toBe(0);
      expect(cache.get<boolean>("false")).toBe(false);
    });
  });

  describe("TTL 过期", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    test("过期后 get 返回 undefined", () => {
      cache.set("expires", "value", 1000);
      expect(cache.get<string>("expires")).toBe("value");

      jest.advanceTimersByTime(999);
      expect(cache.get<string>("expires")).toBe("value");

      jest.advanceTimersByTime(2);
      expect(cache.get<string>("expires")).toBeUndefined();
    });

    test("过期后再次 get 不返回（已删除）", () => {
      cache.set("exp", "x", 500);
      jest.advanceTimersByTime(600);
      expect(cache.get<string>("exp")).toBeUndefined();
      jest.advanceTimersByTime(1000);
      expect(cache.get<string>("exp")).toBeUndefined();
    });

    test("不同条目的 TTL 独立计算", () => {
      cache.set("short", "s", 100);
      cache.set("long", "l", 500);
      jest.advanceTimersByTime(150);
      expect(cache.get<string>("short")).toBeUndefined();
      expect(cache.get<string>("long")).toBe("l");
    });
  });

  describe("delete", () => {
    test("delete 后 get 返回 undefined", () => {
      cache.set("del", "data", 60000);
      cache.delete("del");
      expect(cache.get<string>("del")).toBeUndefined();
    });

    test("delete 不存在的 key 不报错", () => {
      expect(() => cache.delete("nope")).not.toThrow();
    });
  });

  describe("clear", () => {
    test("clear 后所有 key 均不可获取", () => {
      cache.set("a", 1, 60000);
      cache.set("b", 2, 60000);
      cache.clear();
      expect(cache.get<number>("a")).toBeUndefined();
      expect(cache.get<number>("b")).toBeUndefined();
    });

    test("clear 后可以重新 set", () => {
      cache.set("x", "old", 60000);
      cache.clear();
      cache.set("x", "new", 60000);
      expect(cache.get<string>("x")).toBe("new");
    });
  });

  describe("覆盖写入", () => {
    test("同一 key 再次 set 覆盖旧值", () => {
      cache.set("key", "first", 60000);
      cache.set("key", "second", 60000);
      expect(cache.get<string>("key")).toBe("second");
    });
  });
});
