/**
 * 新词学习页面 - 卡片翻转模式学习新单词
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FlashCard } from "@/components/word/flash-card";
import { QualityButtons } from "@/components/word/quality-buttons";
import { useLearningData } from "@/lib/use-learning-data";
import { useStudyTimer } from "@/lib/use-study-timer";
import { useCardShortcuts } from "@/lib/use-keyboard-shortcuts";
import type { Word } from "@/types";
import { StudySkeleton } from "@/components/ui/study-skeleton";
import { useBookWords } from "@/lib/use-book-words";

export default function NewWordsPage() {
  const router = useRouter();
  const {
    hydrated,
    currentBookId,
    settings,
    getNewWordIds,
    updateWordProgress,
  } = useLearningData();

  // SWR 缓存共享：学习中心已预取，此处直接命中缓存
  const { words: allWords, isLoading: wordsLoading } = useBookWords(
    hydrated ? currentBookId : null,
    settings.wordOrder
  );

  const [studyWords, setStudyWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 });
  /** 学习时长追踪（自动暂停/恢复，定时同步到 store） */
  const { elapsedSeconds, stopTimer } = useStudyTimer();
  /** 完成时的总秒数快照 */
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [wordsReady, setWordsReady] = useState(false);

  // 数据就绪后筛选新词
  useEffect(() => {
    if (!hydrated || wordsLoading || allWords.length === 0) return;
    if (!currentBookId) {
      router.push("/learn");
      return;
    }

    const wordIds = allWords.map((w) => w.id);
    const newIds = getNewWordIds(wordIds, settings.dailyNewWords);
    const newWords = allWords.filter((w) => newIds.includes(w.id));
    setStudyWords(newWords);
    setWordsReady(true);
  }, [currentBookId, router, settings.dailyNewWords, getNewWordIds, hydrated, allWords, wordsLoading]);

  const loading = !wordsReady;

  /** 快捷键翻转 */
  const handleFlipToggle = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  /** 处理用户评分 */
  const handleRate = useCallback(
    (quality: number) => {
      if (currentIndex >= studyWords.length) return;

      const word = studyWords[currentIndex];
      updateWordProgress(word.id, quality);

      setSessionStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (quality >= 3 ? 1 : 0),
      }));

      // 移动到下一个单词
      if (currentIndex + 1 < studyWords.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // 学习完成：停止计时并保存最终时长
        const totalSec = stopTimer();
        setFinalSeconds(totalSec);
        setIsComplete(true);
      }
    },
    [currentIndex, studyWords, updateWordProgress, stopTimer]
  );

  // 快捷键：空格翻转、1-4评分、Esc返回（必须在所有 early return 之前调用）
  useCardShortcuts({
    onFlip: handleFlipToggle,
    onRate: handleRate,
    isFlipped,
    isComplete,
    simplified: true,
  });

  if (loading) {
    return <StudySkeleton />;
  }

  // 没有新词可学
  if (studyWords.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/learn")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回学习中心
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Trophy className="h-16 w-16 text-amber-400" />
          <h2 className="mt-4 text-xl font-semibold">太棒了！</h2>
          <p className="mt-2 text-muted-foreground">
            当前词库的新词已经全部学完了，去复习一下吧
          </p>
          <Link href="/learn/review">
            <Button className="mt-6">
              开始复习
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 学习完成
  if (isComplete) {
    const duration = Math.round(finalSeconds / 60);
    const accuracy =
      sessionStats.total > 0
        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
        : 0;

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/learn")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回学习中心
        </Button>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/30">
            <Trophy className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">学习完成！</h2>
          <p className="mt-2 text-muted-foreground">
            本次学习了 {sessionStats.total} 个新单词
          </p>

          <div className="mt-6 grid grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{sessionStats.total}</p>
                <p className="text-sm text-muted-foreground">学习单词</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{accuracy}%</p>
                <p className="text-sm text-muted-foreground">记忆率</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-500">{duration}</p>
                <p className="text-sm text-muted-foreground">用时(分钟)</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex gap-3">
            <Link href="/learn/review">
              <Button variant="outline">
                去复习
              </Button>
            </Link>
            <Link href="/learn">
              <Button>
                返回学习中心
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = studyWords[currentIndex];
  const progressPercent = Math.round((currentIndex / studyWords.length) * 100);

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/learn")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {studyWords.length}
        </span>
      </div>

      {/* 进度条 */}
      <Progress value={progressPercent} />

      {/* 卡片区域 */}
      <div className="py-4">
        <FlashCard
          key={currentWord.id}
          word={currentWord}
          showPhonetic={settings.showPhonetic}
          autoPlayAudio={settings.autoPlayAudio}
          flipped={isFlipped}
          onFlip={(f) => setIsFlipped(f)}
        />
      </div>

      {/* 评分按钮（翻转后显示） */}
      {isFlipped && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <p className="text-center text-sm text-muted-foreground mb-3">
            你对这个单词的掌握程度？<span className="text-xs ml-1 opacity-60">（键盘 1-4 快速评分）</span>
          </p>
          <QualityButtons onRate={handleRate} simplified />
        </div>
      )}
    </div>
  );
}
