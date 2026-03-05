/**
 * 单词发音工具模块
 * 使用有道词典 TTS API 提供真正的美式/英式发音
 *
 * 有道词典 TTS 接口：
 * - 美式: https://dict.youdao.com/dictvoice?type=0&audio=word
 * - 英式: https://dict.youdao.com/dictvoice?type=1&audio=word
 */

import type { PronunciationType } from "@/types";

// 音频实例缓存，避免重复创建和同时播放
let currentAudio: HTMLAudioElement | null = null;

/**
 * 获取有道词典 TTS 发音 URL
 * @param word - 英文单词
 * @param pronunciation - 发音类型（"en-US" 美式 / "en-GB" 英式）
 */
export function getAudioUrl(word: string, pronunciation: PronunciationType): string {
  // type=0 美式，type=1 英式
  const type = pronunciation === "en-GB" ? 1 : 0;
  return `https://dict.youdao.com/dictvoice?type=${type}&audio=${encodeURIComponent(word)}`;
}

/**
 * 播放单词发音
 * 使用有道词典 TTS API，支持真正的美式/英式发音
 *
 * @param word - 英文单词
 * @param pronunciation - 发音类型（"en-US" 美式 / "en-GB" 英式）
 */
export function playWordAudio(word: string, pronunciation: PronunciationType): void {
  // 停止当前正在播放的音频
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  const url = getAudioUrl(word, pronunciation);
  const audio = new Audio(url);
  currentAudio = audio;

  audio.play().catch(() => {
    // 有道 TTS 不可用时，回退到 Web Speech API
    fallbackToSpeechSynthesis(word, pronunciation);
  });

  // 播放结束后清理引用
  audio.addEventListener("ended", () => {
    if (currentAudio === audio) {
      currentAudio = null;
    }
  });
}

/**
 * Web Speech API 回退方案
 * 当有道 TTS 不可用时使用（如离线场景）
 */
function fallbackToSpeechSynthesis(word: string, pronunciation: PronunciationType): void {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = pronunciation;
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }
}
