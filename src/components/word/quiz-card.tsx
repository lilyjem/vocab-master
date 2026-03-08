/**
 * 选择题组件 - 四选一测试
 */
"use client";

import { useState } from "react";
import { Volume2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLearningData } from "@/lib/use-learning-data";
import { playWordAudio } from "@/lib/audio";
import type { Word } from "@/types";

interface QuizCardProps {
  word: Word; // 正确答案的单词
  options: string[]; // 4个选项（中文释义）
  mode: "en2cn" | "cn2en"; // 英译中 或 中译英
  onAnswer: (isCorrect: boolean) => void;
}

export function QuizCard({ word, options, mode, onAnswer }: QuizCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const correctAnswer = mode === "en2cn" ? word.definition : word.word;

  const { settings } = useLearningData();
  const pronunciation = settings.pronunciation;

  /** 播放发音（有道词典 TTS，真正区分美式/英式） */
  const playAudio = () => {
    playWordAudio(word.word, pronunciation);
  };

  /** 选择答案 */
  const handleSelect = (index: number) => {
    if (isAnswered) return;

    setSelectedIndex(index);
    setIsAnswered(true);

    const isCorrect = options[index] === correctAnswer;
    // 延迟回调，让用户看到结果
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1200);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* 题目区域 */}
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        {mode === "en2cn" ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold">{word.word}</span>
              <button
                onClick={playAudio}
                className="rounded-full p-1.5 hover:bg-muted transition-colors"
              >
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {word.phonetic && (
              <span className="mt-1 block text-sm text-muted-foreground">
                {word.phonetic}
              </span>
            )}
            <p className="mt-4 text-muted-foreground">请选择正确的中文释义</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold">{word.definition}</p>
            {word.partOfSpeech && (
              <span className="mt-1 block text-sm text-muted-foreground">
                ({word.partOfSpeech})
              </span>
            )}
            <p className="mt-4 text-muted-foreground">请选择对应的英文单词</p>
          </>
        )}
      </div>

      {/* 选项区域 */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((option, index) => {
          const isCorrectOption = option === correctAnswer;
          const isSelected = selectedIndex === index;

          let optionStyle = "border-border hover:border-primary/50 hover:bg-muted/50";
          if (isAnswered) {
            if (isCorrectOption) {
              optionStyle = "border-green-500 bg-green-50 dark:bg-green-900/20";
            } else if (isSelected && !isCorrectOption) {
              optionStyle = "border-red-500 bg-red-50 dark:bg-red-900/20";
            } else {
              optionStyle = "border-border opacity-50";
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={isAnswered}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all",
                optionStyle,
                !isAnswered && "cursor-pointer active:scale-[0.98]"
              )}
            >
              {/* 选项序号 */}
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                {String.fromCharCode(65 + index)}
              </span>

              <span className="flex-1 text-sm font-medium">{option}</span>

              {/* 结果图标 */}
              {isAnswered && isCorrectOption && (
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
              {isAnswered && isSelected && !isCorrectOption && (
                <X className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
