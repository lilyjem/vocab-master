/**
 * 选择题测验页面 - 四选一快速测试
 */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuizCard } from "@/components/word/quiz-card";
import { useLearningData } from "@/lib/use-learning-data";
import { useStudyTimer } from "@/lib/use-study-timer";
import { useQuizShortcuts } from "@/lib/use-keyboard-shortcuts";
import { shuffle, sampleArray } from "@/lib/utils";
import type { Word } from "@/types";
import { StudySkeleton } from "@/components/ui/study-skeleton";
import { useBookWords } from "@/lib/use-book-words";

/** 选择题每轮的题目数量 */
const QUIZ_BATCH_SIZE = 15;

export default function QuizPage() {
  const router = useRouter();
  const { hydrated, currentBookId, settings, updateWordProgress } = useLearningData();

  // SWR 缓存共享：学习中心已预取，此处直接命中缓存
  const { words: allWords, isLoading: wordsLoading } = useBookWords(
    hydrated ? currentBookId : null,
    settings.wordOrder
  );

  const [studyWords, setStudyWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 });
  const [quizMode] = useState<"en2cn" | "cn2en">("en2cn");
  /** 学习时长追踪 */
  const { elapsedSeconds, stopTimer } = useStudyTimer();
  /** 完成时的总秒数快照 */
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [wordsReady, setWordsReady] = useState(false);

  useEffect(() => {
    if (!hydrated || wordsLoading || allWords.length === 0) return;
    if (!currentBookId) {
      router.push("/learn");
      return;
    }

    // 随机选取一批单词作为测试
    const selected = shuffle(allWords).slice(0, QUIZ_BATCH_SIZE);
    setStudyWords(selected);
    setWordsReady(true);
  }, [hydrated, currentBookId, router, allWords, wordsLoading]);

  const loading = !wordsReady;

  // 快捷键：Esc 返回学习中心
  useQuizShortcuts({ isComplete });

  /** 缓存当前单词的四个选项，避免 render 时重新随机 */
  const currentOptions = useMemo(() => {
    if (studyWords.length === 0 || currentIndex >= studyWords.length) return [];
    const word = studyWords[currentIndex];
    const correctAnswer = quizMode === "en2cn" ? word.definition : word.word;

    const otherWords = allWords.filter((w) => w.id !== word.id);
    const distractors = sampleArray(otherWords, 3).map((w) =>
      quizMode === "en2cn" ? w.definition : w.word
    );

    return shuffle([correctAnswer, ...distractors]);
  }, [studyWords, currentIndex, allWords, quizMode]);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (currentIndex >= studyWords.length) return;

      const word = studyWords[currentIndex];
      updateWordProgress(word.id, isCorrect ? 4 : 2);

      setSessionStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
      }));

      if (currentIndex + 1 < studyWords.length) {
        setCurrentIndex((prev) => prev + 1);
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
          <ListChecks className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">暂无可测试的单词</h2>
          <p className="mt-2 text-muted-foreground">词库中还没有单词数据</p>
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
          <div className="rounded-full bg-amber-100 p-6 dark:bg-amber-900/30">
            <ListChecks className="h-12 w-12 text-amber-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">测验完成！</h2>

          <div className="mt-6 grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{sessionStats.total}</p>
                <p className="text-sm text-muted-foreground">总题数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{sessionStats.correct}</p>
                <p className="text-sm text-muted-foreground">答对</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{accuracy}%</p>
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

      <Progress value={progressPercent} indicatorClassName="bg-amber-500" />

      <div className="py-4">
        <QuizCard
          key={currentWord.id}
          word={currentWord}
          options={currentOptions}
          mode={quizMode}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}
