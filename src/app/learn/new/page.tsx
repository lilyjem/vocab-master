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
import { useLearningStore, useStoreHydrated } from "@/lib/store";
import type { Word } from "@/types";

export default function NewWordsPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();

  const currentBookId = useLearningStore((s) => s.currentBookId);
  const settings = useLearningStore((s) => s.settings);
  const getNewWordIds = useLearningStore((s) => s.getNewWordIds);
  const updateWordProgress = useLearningStore((s) => s.updateWordProgress);

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [studyWords, setStudyWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 });
  const [startTime] = useState(new Date());

  // 加载词库数据并筛选新词
  useEffect(() => {
    if (!hydrated) return;
    if (!currentBookId) {
      router.push("/learn");
      return;
    }

    fetch(`/api/words/${currentBookId}?all=true`)
      .then((res) => res.json())
      .then((data) => {
        const words: Word[] = Array.isArray(data?.words) ? data.words : [];
        setAllWords(words);

        const wordIds = words.map((w) => w.id);
        const newIds = getNewWordIds(wordIds, settings.dailyNewWords);
        const newWords = words.filter((w) => newIds.includes(w.id));

        setStudyWords(newWords);
        setLoading(false);
      })
      .catch(() => {
        setAllWords([]);
        setStudyWords([]);
        setLoading(false);
      });
  }, [currentBookId, router, settings.dailyNewWords, getNewWordIds, hydrated]);

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
        setIsComplete(true);
      }
    },
    [currentIndex, studyWords, updateWordProgress]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
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
    const duration = Math.round(
      (new Date().getTime() - startTime.getTime()) / 60000
    );
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
          onFlip={(flipped) => setIsFlipped(flipped)}
        />
      </div>

      {/* 评分按钮（翻转后显示） */}
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
