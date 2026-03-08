/**
 * 外部词典 API 客户端
 * 从 Free Dictionary API (dictionaryapi.dev) 获取例句和词源
 * 使用百度翻译 API 将英文例句翻译为中文
 */

import { createHash } from "crypto";

interface ExampleSentence {
  sentence: string;
  translation?: string;
}

interface EtymologyData {
  origin?: string;
  roots: { part: string; meaning: string }[];
  relatedWords: string[];
}

/**
 * 百度翻译 API：将英文文本翻译为中文
 * 需要环境变量 BAIDU_TRANSLATE_APPID 和 BAIDU_TRANSLATE_SECRET
 * 支持批量翻译（多行文本用 \n 分隔）
 */
async function baiduTranslate(texts: string[]): Promise<string[]> {
  const appid = process.env.BAIDU_TRANSLATE_APPID;
  const secret = process.env.BAIDU_TRANSLATE_SECRET;

  if (!appid || !secret) {
    return texts.map(() => "");
  }

  try {
    // 百度翻译支持 \n 分隔的批量翻译
    const query = texts.join("\n");
    const salt = Date.now().toString();
    const sign = createHash("md5")
      .update(appid + query + salt + secret)
      .digest("hex");

    const params = new URLSearchParams({
      q: query,
      from: "en",
      to: "zh",
      appid,
      salt,
      sign,
    });

    const res = await fetch(
      `https://fanyi-api.baidu.com/api/trans/vip/translate?${params}`
    );
    if (!res.ok) return texts.map(() => "");

    const data = await res.json();
    if (data.error_code) {
      console.error("百度翻译错误:", data.error_code, data.error_msg);
      return texts.map(() => "");
    }

    // trans_result 数组与输入行一一对应
    const results: string[] = [];
    for (let i = 0; i < texts.length; i++) {
      results.push(data.trans_result?.[i]?.dst || "");
    }
    return results;
  } catch (error) {
    console.error("百度翻译请求失败:", error);
    return texts.map(() => "");
  }
}

/**
 * 从 Free Dictionary API 获取单词例句，并通过百度翻译获取中文翻译
 */
export async function fetchExamples(word: string): Promise<ExampleSentence[]> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    const sentences: string[] = [];

    // 从 meanings[].definitions[].example 提取例句
    for (const entry of data) {
      for (const meaning of entry.meanings || []) {
        for (const def of meaning.definitions || []) {
          if (def.example) {
            sentences.push(def.example);
          }
        }
      }
    }

    const trimmed = sentences.slice(0, 5);
    if (trimmed.length === 0) return [];

    // 批量翻译所有例句
    const translations = await baiduTranslate(trimmed);

    return trimmed.map((sentence, i) => ({
      sentence,
      translation: translations[i] || undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * 从 Free Dictionary API 获取词源信息
 */
export async function fetchEtymology(word: string): Promise<EtymologyData> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) return { roots: [], relatedWords: [] };

    const data = await res.json();
    const entry = data[0];

    // 提取词源
    const origin = entry?.origin || undefined;

    // 从 phonetics 和 meanings 中提取相关词
    const relatedWords: string[] = [];
    for (const meaning of entry?.meanings || []) {
      for (const syn of meaning.synonyms || []) {
        if (!relatedWords.includes(syn)) relatedWords.push(syn);
      }
    }

    // 简单的词根词缀分析（基于常见模式）
    const roots = analyzeWordParts(word);

    return {
      origin,
      roots,
      relatedWords: relatedWords.slice(0, 8),
    };
  } catch {
    return { roots: [], relatedWords: [] };
  }
}

// 常见英语前缀
const PREFIXES: { prefix: string; meaning: string }[] = [
  { prefix: "un", meaning: "不/非" },
  { prefix: "re", meaning: "再/重新" },
  { prefix: "pre", meaning: "预先/前" },
  { prefix: "dis", meaning: "不/否" },
  { prefix: "mis", meaning: "错误" },
  { prefix: "over", meaning: "过度/超过" },
  { prefix: "under", meaning: "不足/下" },
  { prefix: "inter", meaning: "之间" },
  { prefix: "trans", meaning: "跨越" },
  { prefix: "super", meaning: "超级" },
  { prefix: "sub", meaning: "下/次" },
  { prefix: "anti", meaning: "反对" },
  { prefix: "auto", meaning: "自动/自己" },
  { prefix: "bi", meaning: "双/二" },
  { prefix: "co", meaning: "共同" },
  { prefix: "counter", meaning: "反/对" },
  { prefix: "de", meaning: "去除/向下" },
  { prefix: "ex", meaning: "前/出" },
  { prefix: "extra", meaning: "额外" },
  { prefix: "fore", meaning: "前/预" },
  { prefix: "in", meaning: "不/内" },
  { prefix: "im", meaning: "不/内" },
  { prefix: "ir", meaning: "不" },
  { prefix: "il", meaning: "不" },
  { prefix: "multi", meaning: "多" },
  { prefix: "non", meaning: "非" },
  { prefix: "out", meaning: "超过/外" },
  { prefix: "post", meaning: "后" },
  { prefix: "semi", meaning: "半" },
  { prefix: "tri", meaning: "三" },
];

// 常见英语后缀
const SUFFIXES: { suffix: string; meaning: string }[] = [
  { suffix: "able", meaning: "可...的" },
  { suffix: "ible", meaning: "可...的" },
  { suffix: "tion", meaning: "名词化" },
  { suffix: "sion", meaning: "名词化" },
  { suffix: "ment", meaning: "名词化" },
  { suffix: "ness", meaning: "名词化" },
  { suffix: "ful", meaning: "充满...的" },
  { suffix: "less", meaning: "无...的" },
  { suffix: "ous", meaning: "...的" },
  { suffix: "ive", meaning: "...的" },
  { suffix: "al", meaning: "...的" },
  { suffix: "ial", meaning: "...的" },
  { suffix: "ly", meaning: "副词化" },
  { suffix: "er", meaning: "做...的人" },
  { suffix: "or", meaning: "做...的人" },
  { suffix: "ist", meaning: "...者" },
  { suffix: "ism", meaning: "...主义" },
  { suffix: "ize", meaning: "使...化" },
  { suffix: "ise", meaning: "使...化" },
  { suffix: "ify", meaning: "使...化" },
  { suffix: "ity", meaning: "名词化" },
  { suffix: "ence", meaning: "名词化" },
  { suffix: "ance", meaning: "名词化" },
  { suffix: "ing", meaning: "进行中" },
  { suffix: "ed", meaning: "过去式/形容词" },
  { suffix: "en", meaning: "使..." },
];

/**
 * 分析单词的词根词缀结构
 */
function analyzeWordParts(word: string): { part: string; meaning: string }[] {
  const lower = word.toLowerCase();
  const parts: { part: string; meaning: string }[] = [];
  let remaining = lower;

  // 检查前缀（从长到短匹配）
  const sortedPrefixes = [...PREFIXES].sort(
    (a, b) => b.prefix.length - a.prefix.length
  );
  for (const { prefix, meaning } of sortedPrefixes) {
    if (
      remaining.startsWith(prefix) &&
      remaining.length > prefix.length + 2
    ) {
      parts.push({ part: `${prefix}-`, meaning });
      remaining = remaining.slice(prefix.length);
      break;
    }
  }

  // 检查后缀（从长到短匹配）
  const sortedSuffixes = [...SUFFIXES].sort(
    (a, b) => b.suffix.length - a.suffix.length
  );
  let suffixPart: { part: string; meaning: string } | null = null;
  for (const { suffix, meaning } of sortedSuffixes) {
    if (
      remaining.endsWith(suffix) &&
      remaining.length > suffix.length + 2
    ) {
      suffixPart = { part: `-${suffix}`, meaning };
      remaining = remaining.slice(0, remaining.length - suffix.length);
      break;
    }
  }

  // 中间部分作为词根
  if (remaining.length > 0) {
    parts.push({ part: remaining, meaning: "词根" });
  }

  if (suffixPart) {
    parts.push(suffixPart);
  }

  return parts;
}
