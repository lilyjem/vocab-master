/**
 * 通用工具函数
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** 合并 Tailwind CSS 类名（处理冲突） */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 格式化日期为 YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** 格式化日期为中文显示 */
export function formatDateCN(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/** 计算两个日期之间的天数差 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(date1.getTime() - date2.getTime()) / oneDay);
}

/** 获取今天的 Date（时间归零） */
export function getToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/** 计算百分比 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/** 随机打乱数组 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 从数组中随机取 n 个元素 */
export function sampleArray<T>(array: T[], n: number): T[] {
  return shuffle(array).slice(0, n);
}
