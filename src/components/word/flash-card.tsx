/**
 * 翻转卡片组件 - 单词学习的核心交互组件
 * 正面显示英文单词，点击翻转显示释义和例句
 */
"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLearningData } from "@/lib/use-learning-data";
import { playWordAudio } from "@/lib/audio";
import { ExampleSentences } from "@/components/word/example-sentences";
import { EtymologyPanel } from "@/components/word/etymology-panel";
import type { Word } from "@/types";

interface FlashCardProps {
  word: Word;
  showPhonetic?: boolean;
  autoPlayAudio?: boolean;
  onFlip?: (isFlipped: boolean) => void;
}

export function FlashCard({
  word,
  showPhonetic = true,
  autoPlayAudio = false,
  onFlip,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { settings } = useLearningData();
  const pronunciation = settings.pronunciation;

  /** 播放单词发音（有道词典 TTS，真正区分美式/英式） */
  const playAudio = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    playWordAudio(word.word, pronunciation);
  };

  /** 翻转卡片 */
  const handleFlip = () => {
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    onFlip?.(newFlipped);
    if (!isFlipped && autoPlayAudio) {
      playAudio();
    }
  };

  return (
    <div
      className="perspective-1000 cursor-pointer select-none"
      onClick={handleFlip}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleFlip(); } }}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? `${word.word}: ${word.definition}` : `单词: ${word.word}，点击翻转查看释义`}
    >
      <div
        className={cn(
          "relative h-72 w-full max-w-lg mx-auto transition-transform duration-500",
          "[transform-style:preserve-3d]",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* ===== 正面 - 英文单词 ===== */}
        <div className="absolute inset-0 rounded-2xl border border-border bg-card shadow-lg p-8 flex flex-col items-center justify-center [backface-visibility:hidden]">
          <button
            onClick={playAudio}
            aria-label={`播放 ${word.word} 的发音`}
            className="absolute top-4 right-4 rounded-full p-2 hover:bg-muted transition-colors"
          >
            <Volume2 className="h-5 w-5 text-muted-foreground" />
          </button>

          <span className="text-4xl font-bold tracking-wide">{word.word}</span>

          {showPhonetic && word.phonetic && (
            <span className="mt-3 text-lg text-muted-foreground">
              {word.phonetic}
            </span>
          )}

          {word.partOfSpeech && (
            <span className="mt-2 text-sm text-muted-foreground/70">
              {word.partOfSpeech}
            </span>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            点击翻转查看释义
          </p>
        </div>

        {/* ===== 背面 - 中文释义和例句 ===== */}
        <div className="absolute inset-0 rounded-2xl border border-border bg-card shadow-lg p-8 flex flex-col items-center overflow-y-auto [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <button
            onClick={playAudio}
            aria-label={`播放 ${word.word} 的发音`}
            className="absolute top-4 right-4 rounded-full p-2 hover:bg-muted transition-colors z-10"
          >
            <Volume2 className="h-5 w-5 text-muted-foreground" />
          </button>

          <span className="text-2xl font-bold text-primary">{word.word}</span>

          {word.phonetic && (
            <span className="mt-1 text-sm text-muted-foreground">
              {word.phonetic} {word.partOfSpeech && `· ${word.partOfSpeech}`}
            </span>
          )}

          <div className="mt-4 text-center w-full">
            <p className="text-xl font-semibold">{word.definition}</p>
          </div>

          {word.example && (
            <div className="mt-4 w-full rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm italic text-foreground">{word.example}</p>
              {word.exampleTranslation && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {word.exampleTranslation}
                </p>
              )}
            </div>
          )}

          <div
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <ExampleSentences word={word.word} onInteraction={(e) => e.stopPropagation()} />
            <EtymologyPanel word={word.word} onInteraction={(e) => e.stopPropagation()} />
          </div>
        </div>
      </div>
    </div>
  );
}
