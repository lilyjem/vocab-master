/**
 * 复习模式页面 - 复习到期的单词
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FlashCard } from "@/components/word/flash-card";
import { QualityButtons } from "@/components/word/quality-buttons";
import { useLearningData } from "@/lib/use-learning-data";
import { useStudyTimer } from "@/lib/use-study-timer";
import type { Word } from "@/types";
import { apiUrl } from "@/lib/utils";
import { StudySkeleton } from "@/components/ui/study-skeleton";

export default function ReviewPage() {
  const router = useRouter();
  const {
    hydrated,
    currentBookId,
    settings,
    getReviewWordIds,
    updateWordProgress,
  } = useLearningData();

  const [studyWords, setStudyWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 });
  /** 学习时长追踪 */
  const { elapsedSeconds, stopTimer } = useStudyTimer();
  /** 完成时的总秒数快照 */
  const [finalSeconds, setFinalSeconds] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentBookId) {
      router.push("/learn");
      return;
    }

    fetch(apiUrl(`/api/words/${currentBookId}?all=true`))
      .then((res) => res.json())
      .then((data) => {
        const words: Word[] = Array.isArray(data?.words) ? data.words : [];
        const wordIds = words.map((w) => w.id);
        const reviewIds = getReviewWordIds(wordIds, settings.dailyReviewWords);
        const reviewWords = words.filter((w) => reviewIds.includes(w.id));

        setStudyWords(reviewWords);
        setLoading(false);
      })
      .catch(() => {
        setStudyWords([]);
        setLoading(false);
      });
  }, [currentBookId, router, settings.dailyReviewWords, getReviewWordIds, hydrated]);

  const handleRate = useCallback(
    (quality: number) => {
      if (currentIndex >= studyWords.length) return;

      const word = studyWords[currentIndex];
      updateWordProgress(word.id, quality);

      setSessionStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (quality >= 3 ? 1 : 0),
      }));

      if (currentIndex + 1 < studyWords.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        const totalSec = stopTimer();
        setFinalSeconds(totalSec);
        setIsComplete(true);
      }
    },
    [currentIndex, studyWords, updateWordProgress, stopTimer]
  );

  if (loading) {
    return <StudySkeleton />;
  }

  if (studyWords.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/learn")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回学习中心
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/30">
            <Trophy className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">没有需要复习的单词</h2>
          <p className="mt-2 text-muted-foreground">
            当前没有到期需要复习的单词，去学习新词吧
          </p>
          <Link href="/learn/new">
            <Button className="mt-6">学习新词</Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <RotateCcw className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">复习完成！</h2>
          <p className="mt-2 text-muted-foreground">
            本次复习了 {sessionStats.total} 个单词
          </p>

          <div className="mt-6 grid grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{sessionStats.total}</p>
                <p className="text-sm text-muted-foreground">复习单词</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{accuracy}%</p>
                <p className="text-sm text-muted-foreground">正确率</p>
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
            <Link href="/learn">
              <Button>返回学习中心</Button>
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
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/learn")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {studyWords.length}
        </span>
      </div>

      <Progress value={progressPercent} indicatorClassName="bg-green-500" />

      <div className="py-4">
        <FlashCard
          key={currentWord.id}
          word={currentWord}
          showPhonetic={settings.showPhonetic}
          autoPlayAudio={settings.autoPlayAudio}
          onFlip={(flipped) => setIsFlipped(flipped)}
        />
      </div>

      {isFlipped && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <p className="text-center text-sm text-muted-foreground mb-3">
            你对这个单词的掌握程度？
          </p>
          <QualityButtons onRate={handleRate} simplified />
        </div>
      )}
    </div>
  );
}
