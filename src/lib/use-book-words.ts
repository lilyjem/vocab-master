/**
 * 词库单词数据 SWR Hook
 * 所有需要词库单词数据的页面共享此 hook，利用 SWR 全局缓存避免重复请求。
 * 学习中心页面预取后，子页面可直接命中缓存，实现近乎即时的页面切换。
 *
 * 支持 wordOrder 参数控制排序：freq-desc | freq-asc | alpha | random
 */
"use client";

import useSWR, { preload } from "swr";
import type { Word, WordOrderType } from "@/types";
import { apiUrl } from "@/lib/utils";

/**
 * SWR key 生成函数
 * 包含 wordOrder 以区分不同排序的缓存
 */
function bookWordsKey(bookId: string | null, wordOrder: WordOrderType = "freq-desc") {
  if (!bookId) return null;
  return `/api/words/${bookId}?all=true&order=${wordOrder}`;
}

/** 通用 fetcher：自动拼接 basePath */
async function bookWordsFetcher(path: string): Promise<{ name: string; words: Word[] }> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error(`获取词库数据失败: ${res.status}`);
  const data = await res.json();
  return {
    name: data?.name || "",
    words: Array.isArray(data?.words) ? data.words : [],
  };
}

/**
 * 预取词库单词数据到 SWR 全局缓存
 * 在学习中心页面调用，子页面进入时直接命中缓存
 */
export function preloadBookWords(bookId: string | null, wordOrder: WordOrderType = "freq-desc") {
  const key = bookWordsKey(bookId, wordOrder);
  if (key) {
    preload(key, bookWordsFetcher);
  }
}

/**
 * 获取词库全部单词数据
 * 利用 SWR 缓存：首次请求后，同一 bookId + wordOrder 的数据在整个会话中共享
 */
export function useBookWords(bookId: string | null, wordOrder: WordOrderType = "freq-desc") {
  const { data, isLoading, error } = useSWR(
    bookWordsKey(bookId, wordOrder),
    bookWordsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // 10 分钟内不重新请求（与服务端缓存 TTL 一致）
      dedupingInterval: 10 * 60 * 1000,
    }
  );

  return {
    words: data?.words ?? [],
    bookName: data?.name ?? "",
    isLoading,
    error,
  };
}
