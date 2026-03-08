/**
 * 词频数据匹配测试
 */
import { describe, it, expect } from "@jest/globals";
import { getWordFrequency } from "../seed/frequency-data";

describe("getWordFrequency", () => {
  it("应该为最高频词返回接近 5000 的值", () => {
    expect(getWordFrequency("the")).toBe(5000);
    expect(getWordFrequency("be")).toBe(4999);
    expect(getWordFrequency("to")).toBe(4998);
  });

  it("应该为常见单词返回较高的词频值", () => {
    expect(getWordFrequency("time")).toBeGreaterThan(4000);
    expect(getWordFrequency("people")).toBeGreaterThan(4000);
    expect(getWordFrequency("work")).toBeGreaterThan(4000);
  });

  it("高频词的值应该大于低频词", () => {
    expect(getWordFrequency("the")).toBeGreaterThan(getWordFrequency("algorithm"));
    expect(getWordFrequency("good")).toBeGreaterThan(getWordFrequency("sophisticated"));
    expect(getWordFrequency("make")).toBeGreaterThan(getWordFrequency("unprecedented"));
  });

  it("未知单词应该返回 0", () => {
    expect(getWordFrequency("xyznonexistent")).toBe(0);
    expect(getWordFrequency("asdfghjkl")).toBe(0);
  });

  it("应该不区分大小写", () => {
    expect(getWordFrequency("The")).toBe(getWordFrequency("the"));
    expect(getWordFrequency("HELLO")).toBe(getWordFrequency("hello"));
    expect(getWordFrequency("World")).toBe(getWordFrequency("world"));
  });

  it("GRE/TOEFL 词汇应该有词频值", () => {
    expect(getWordFrequency("hypothesis")).toBeGreaterThan(0);
    expect(getWordFrequency("phenomenon")).toBeGreaterThan(0);
    expect(getWordFrequency("unprecedented")).toBeGreaterThan(0);
  });
});
