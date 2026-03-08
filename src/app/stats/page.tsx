/**
 * 统计分析页面 - 学习数据可视化
 * 图表组件使用 next/dynamic 懒加载，减小首屏包体积（Recharts ~200KB）
 */
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
import {
  Target,
  Flame,
  BookOpen,
  Award,
  AlertTriangle,
  Volume2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// 懒加载图表组件（Recharts 较重，ssr: false 避免服务端渲染问题）
const LearningAreaChart = dynamic(
  () =>
    import("@/components/stats/learning-chart").then((mod) => mod.LearningAreaChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const LearningBarChart = dynamic(
  () =>
    import("@/components/stats/learning-chart").then((mod) => mod.LearningBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const StreakCalendar = dynamic(
  () => import("@/components/stats/streak-calendar").then((mod) => mod.StreakCalendar),
  { ssr: false, loading: () => <CalendarSkeleton /> }
);

/** 图表加载占位骨架 */
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full" />
      </CardContent>
    </Card>
  );
}

/** 日历加载占位骨架 */
function CalendarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 90 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-3 rounded-sm" />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-sm" />
          <Skeleton className="h-3 w-3 rounded-sm" />
          <Skeleton className="h-3 w-3 rounded-sm" />
        </div>
      </CardContent>
    </Card>
  );
}
import { useLearningData } from "@/lib/use-learning-data";
import { playWordAudio } from "@/lib/audio";
import { percentage, formatDate, getToday, apiUrl } from "@/lib/utils";
import type { Word, WordStatus } from "@/types";

export default function StatsPage() {
  const {
    hydrated,
    wordProgress,
    dailyStats,
    getStreak,
    getTodayStats,
    currentBookId,
    settings,
  } = useLearningData();

  const [words, setWords] = useState<Word[]>([]);
  const [bookName, setBookName] = useState("");

  const streak = getStreak();
  const todayStats = getTodayStats();

  // 加载当前词库的单词（用于薄弱词分析）
  useEffect(() => {
    if (!hydrated) return;
    if (!currentBookId) return;
    fetch(apiUrl(`/api/words/${currentBookId}?all=true`))
      .then((res) => res.json())
      .then((data) => {
        setWords(Array.isArray(data?.words) ? data.words : []);
        setBookName(data?.name || "");
      })
      .catch(() => {
        setWords([]);
        setBookName("");
      });
  }, [currentBookId, hydrated]);

  /** 计算总体统计数据 */
  const overallStats = useMemo(() => {
    const entries = Object.values(wordProgress);
    const total = entries.length;
    const mastered = entries.filter((p) => p.status === "mastered").length;
    const learning = entries.filter((p) => p.status === "learning").length;
    const review = entries.filter((p) => p.status === "review").length;
    const totalReviews = entries.reduce((sum, p) => sum + p.totalReviews, 0);
    const totalCorrect = entries.reduce((sum, p) => sum + p.correctCount, 0);
    const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    return { total, mastered, learning, review, totalReviews, totalCorrect, accuracy };
  }, [wordProgress]);

  /** 获取近30天的每日统计数据（用于图表） */
  const chartData = useMemo(() => {
    const data: { date: string; wordsLearned: number; wordsReviewed: number }[] = [];
    const today = getToday();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const stat = dailyStats[dateStr];
      data.push({
        date: dateStr,
        wordsLearned: stat?.wordsLearned || 0,
        wordsReviewed: stat?.wordsReviewed || 0,
      });
    }

    return data;
  }, [dailyStats]);

  /** 薄弱单词列表（正确率最低的已学单词） */
  const weakWords = useMemo(() => {
    if (words.length === 0) return [];

    return words
      .filter((w) => {
        const p = wordProgress[w.id];
        return p && p.totalReviews >= 2;
      })
      .map((w) => {
        const p = wordProgress[w.id]!;
        return {
          ...w,
          accuracy: p.totalReviews > 0 ? Math.round((p.correctCount / p.totalReviews) * 100) : 0,
          totalReviews: p.totalReviews,
          status: p.status as WordStatus,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10);
  }, [words, wordProgress]);

  const pronunciation = settings.pronunciation;

  /** 播放单词发音（有道词典 TTS，真正区分美式/英式） */
  const playAudio = (word: string) => {
    playWordAudio(word, pronunciation);
  };

  // 等待 Zustand persist hydration 完成，避免 SSR/CSR 内容不匹配
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">学习统计</h1>

      {/* 总览统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">累计学习</p>
              <p className="text-2xl font-bold">{overallStats.total} 词</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Award className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已掌握</p>
              <p className="text-2xl font-bold">{overallStats.mastered} 词</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Target className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总正确率</p>
              <p className="text-2xl font-bold">{overallStats.accuracy}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">连续打卡</p>
              <p className="text-2xl font-bold">{streak} 天</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 掌握进度 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">词汇掌握进度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-500 font-medium">已掌握</span>
                <span>{overallStats.mastered} 词</span>
              </div>
              <Progress
                value={overallStats.total > 0 ? percentage(overallStats.mastered, overallStats.total) : 0}
                indicatorClassName="bg-green-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-amber-500 font-medium">复习中</span>
                <span>{overallStats.review} 词</span>
              </div>
              <Progress
                value={overallStats.total > 0 ? percentage(overallStats.review, overallStats.total) : 0}
                indicatorClassName="bg-amber-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-500 font-medium">学习中</span>
                <span>{overallStats.learning} 词</span>
              </div>
              <Progress
                value={overallStats.total > 0 ? percentage(overallStats.learning, overallStats.total) : 0}
                indicatorClassName="bg-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 打卡日历 */}
      <StreakCalendar data={dailyStats} />

      {/* 学习趋势图表 */}
      <div className="grid gap-6 md:grid-cols-2">
        <LearningAreaChart data={chartData} title="近30天学习趋势" />
        <LearningBarChart data={chartData} title="每日学习量" />
      </div>

      {/* 薄弱单词分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            薄弱单词（正确率最低）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weakWords.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {Object.keys(wordProgress).length === 0
                ? "暂无学习数据，开始学习后将在这里显示薄弱单词"
                : "还没有足够的复习数据来分析薄弱单词"}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {weakWords.map((word, index) => (
                <div
                  key={word.id}
                  className="flex items-center gap-4 py-3 px-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </span>

                  <button
                    onClick={() => playAudio(word.word)}
                    className="rounded-full p-1 hover:bg-muted transition-colors"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{word.word}</span>
                      {word.phonetic && (
                        <span className="text-xs text-muted-foreground">{word.phonetic}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {word.definition}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold ${
                        word.accuracy < 50 ? "text-red-500" : "text-amber-500"
                      }`}
                    >
                      {word.accuracy}%
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {word.totalReviews}次复习
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
