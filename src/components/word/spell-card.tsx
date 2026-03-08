/**
 * 拼写测试组件 - 看释义拼写英文单词
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLearningData } from "@/lib/use-learning-data";
import { playWordAudio } from "@/lib/audio";
import type { Word } from "@/types";

interface SpellCardProps {
  word: Word;
  onAnswer: (isCorrect: boolean) => void;
}

export function SpellCard({ word, onAnswer }: SpellCardProps) {
  const [input, setInput] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 每次换词时聚焦输入框
  useEffect(() => {
    setInput("");
    setIsAnswered(false);
    setIsCorrect(false);
    inputRef.current?.focus();
  }, [word.id]);

  const { settings } = useLearningData();
  const pronunciation = settings.pronunciation;

  /** 播放发音（有道词典 TTS，真正区分美式/英式） */
  const playAudio = () => {
    playWordAudio(word.word, pronunciation);
  };

  /** 提交答案 */
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isAnswered || !input.trim()) return;

    const correct = input.trim().toLowerCase() === word.word.toLowerCase();
    setIsCorrect(correct);
    setIsAnswered(true);
  };

  /** 继续到下一个单词 */
  const handleNext = () => {
    onAnswer(isCorrect);
  };

  /** 按键处理 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isAnswered) {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  };

  /** 渲染拼写对比（答错时显示正确拼写） */
  const renderComparison = () => {
    if (!isAnswered || isCorrect) return null;

    const correctWord = word.word.toLowerCase();
    const userInput = input.trim().toLowerCase();

    return (
      <div className="mt-4 space-y-2">
        <div className="text-center text-sm text-muted-foreground">正确拼写：</div>
        <div className="flex justify-center gap-1">
          {correctWord.split("").map((char, i) => {
            const isWrong = i >= userInput.length || userInput[i] !== char;
            return (
              <span
                key={i}
                className={cn(
                  "inline-flex h-9 w-7 items-center justify-center rounded border text-lg font-mono font-bold",
                  isWrong
                    ? "border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
                    : "border-green-300 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                )}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* 题目区域 */}
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <p className="text-2xl font-bold">{word.definition}</p>
        {word.partOfSpeech && (
          <span className="mt-1 block text-sm text-muted-foreground">
            ({word.partOfSpeech})
          </span>
        )}

        {/* 提示按钮：播放发音 */}
        <button
          onClick={playAudio}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm hover:bg-muted/80 transition-colors"
        >
          <Volume2 className="h-4 w-4" />
          听发音提示
        </button>
      </div>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAnswered}
            placeholder="请输入英文单词..."
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              "w-full rounded-xl border-2 bg-background px-4 py-4 text-center text-xl font-mono font-medium tracking-wider transition-all focus:outline-none",
              !isAnswered && "border-border focus:border-primary",
              isAnswered && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
              isAnswered && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/20"
            )}
          />

          {/* 结果图标 */}
          {isAnswered && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isCorrect ? (
                <Check className="h-6 w-6 text-green-500" />
              ) : (
                <X className="h-6 w-6 text-red-500" />
              )}
            </div>
          )}
        </div>

        {/* 答错后显示对比 */}
        {renderComparison()}

        {/* 操作按钮 */}
        <div className="flex justify-center gap-3">
          {!isAnswered ? (
            <Button
              type="submit"
              size="lg"
              disabled={!input.trim()}
              className="w-40"
            >
              确认
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={handleNext}
              className="w-40"
            >
              下一个
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* 答案反馈 */}
      {isAnswered && (
        <div
          className={cn(
            "rounded-xl p-4 text-center",
            isCorrect
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          )}
        >
          {isCorrect ? (
            <p className="font-medium">拼写正确！</p>
          ) : (
            <p className="font-medium">
              正确答案是：<span className="font-bold">{word.word}</span>
            </p>
          )}
          {word.example && (
            <p className="mt-2 text-sm opacity-80 italic">{word.example}</p>
          )}
        </div>
      )}
    </div>
  );
}
