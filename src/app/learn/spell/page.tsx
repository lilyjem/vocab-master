/**
 * 拼写测试页面 - 看释义拼写英文单词
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SpellCard } from "@/components/word/spell-card";
import { useLearningStore, useStoreHydrated } from "@/lib/store";
import { shuffle, apiUrl } from "@/lib/utils";
import type { Word } from "@/types";

/** 拼写测试每轮的单词数量 */
const SPELL_BATCH_SIZE = 15;

export default function SpellTestPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();

  const currentBookId = useLearningStore((s) => s.currentBookId);
  const updateWordProgress = useLearningStore((s) => s.updateWordProgress);

  const [studyWords, setStudyWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 });

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
        const store = useLearningStore.getState();

        // 优先选择已学过但未掌握的单词，随机取一批
        const learnedWords = words.filter((w) => {
          const p = store.getWordProgress(w.id);
          return p && p.status !== "mastered";
        });

        // 如果没有已学单词，就随机从词库中选
        const pool = learnedWords.length > 0 ? learnedWords : words;
        const selected = shuffle(pool).slice(0, SPELL_BATCH_SIZE);

        setStudyWords(selected);
        setLoading(false);
      })
      .catch(() => {
        setStudyWords([]);
        setLoading(false);
      });
  }, [currentBookId, router, hydrated]);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (currentIndex >= studyWords.length) return;

      const word = studyWords[currentIndex];
      // 拼写正确给4分，错误给1分
      updateWordProgress(word.id, isCorrect ? 4 : 1);

      setSessionStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
      }));

      if (currentIndex + 1 < studyWords.length) {
        setCurrentIndex((prev) => prev + 1);
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

  if (studyWords.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/learn")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回学习中心
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Keyboard className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">暂无可测试的单词</h2>
          <p className="mt-2 text-muted-foreground">先去学习一些新词吧</p>
          <Link href="/learn/new">
            <Button className="mt-6">学习新词</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isComplete) {
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
          <div className="rounded-full bg-purple-100 p-6 dark:bg-purple-900/30">
            <Keyboard className="h-12 w-12 text-purple-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">拼写测试完成！</h2>

          <div className="mt-6 grid grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{sessionStats.total}</p>
                <p className="text-sm text-muted-foreground">测试单词</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{sessionStats.correct}</p>
                <p className="text-sm text-muted-foreground">拼写正确</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{accuracy}%</p>
                <p className="text-sm text-muted-foreground">正确率</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              再来一轮
            </Button>
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

      <Progress value={progressPercent} indicatorClassName="bg-purple-500" />

      <div className="py-4">
        <SpellCard
          key={currentWord.id}
          word={currentWord}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}
