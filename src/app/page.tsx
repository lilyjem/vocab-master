/**
 * 首页仪表盘 - 展示学习概况和快捷入口
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Target,
  Flame,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLearningData } from "@/lib/use-learning-data";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ACHIEVEMENT_META, type AchievementResult } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievements/achievement-card";

export default function HomePage() {
  const {
    hydrated,
    getTodayStats,
    getStreak,
    settings,
    checkLocalAchievements,
    localAchievements,
    wordProgress,
    dailyStats,
    sessions,
  } = useLearningData();

  // 使用 useEffect 避免在渲染期间调用 set() 导致无限循环
  const [achievementResults, setAchievementResults] = useState<AchievementResult[]>([]);
  useEffect(() => {
    if (hydrated) {
      setAchievementResults(checkLocalAchievements());
    }
  }, [hydrated, wordProgress, dailyStats, sessions, checkLocalAchievements]);

  const todayStats = getTodayStats();
  const recentUnlocked = useMemo(
    () =>
      achievementResults
        .filter((r) => r.tier !== "none")
        .map((r) => ({
          ...r,
          unlockedAt: localAchievements[r.code]?.unlockedAt,
        }))
        .sort((a, b) => {
          const aTime = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
          const bTime = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 2),
    [achievementResults, localAchievements]
  );
  const streak = getStreak();

  /** 学习进度百分比 */
  const learnProgress = Math.min(
    100,
    Math.round((todayStats.wordsLearned / settings.dailyNewWords) * 100)
  );
  const reviewProgress = Math.min(
    100,
    Math.round((todayStats.wordsReviewed / settings.dailyReviewWords) * 100)
  );

  if (!hydrated) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight">
          欢迎回来 &#x1F44B;
        </h1>
        <p className="mt-2 text-muted-foreground">
          坚持学习，每天进步一点点
        </p>
      </section>

      {/* 今日概况统计卡片 */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 连续打卡 */}
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

        {/* 今日新学 */}
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">今日新学</p>
              <p className="text-2xl font-bold">
                {todayStats.wordsLearned}
                <span className="text-sm font-normal text-muted-foreground">
                  /{settings.dailyNewWords}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 今日复习 */}
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Target className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">今日复习</p>
              <p className="text-2xl font-bold">
                {todayStats.wordsReviewed}
                <span className="text-sm font-normal text-muted-foreground">
                  /{settings.dailyReviewWords}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 学习时长 */}
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">学习时长</p>
              <p className="text-2xl font-bold">{todayStats.studyMinutes} 分钟</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 今日目标进度 */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              新词学习进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={learnProgress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>已学习 {todayStats.wordsLearned} 个</span>
              <span>目标 {settings.dailyNewWords} 个</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              复习完成进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress
              value={reviewProgress}
              indicatorClassName="bg-green-500"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>已复习 {todayStats.wordsReviewed} 个</span>
              <span>目标 {settings.dailyReviewWords} 个</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 最近解锁成就 */}
      {recentUnlocked.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">最近成就</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recentUnlocked.map((r) => {
              const meta = ACHIEVEMENT_META[r.code];
              return (
                <AchievementCard
                  key={r.code}
                  name={r.name}
                  description={meta?.description ?? ""}
                  icon={meta?.icon ?? "BookOpen"}
                  tier={r.tier}
                  progress={r.progress}
                  maxForCurrentTier={r.maxForCurrentTier}
                />
              );
            })}
          </div>
          <Link
            href="/profile#achievements"
            className="mt-2 block text-sm text-primary hover:underline"
          >
            查看全部成就 →
          </Link>
        </section>
      )}

      {/* 快捷操作 */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/wordbooks">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <GraduationCap className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <p className="font-semibold">选择词库</p>
                  <p className="text-sm text-muted-foreground">
                    浏览并选择学习词库
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/learn">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <BookOpen className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold">开始学习</p>
                  <p className="text-sm text-muted-foreground">
                    学习新词或复习旧词
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/stats">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold">学习统计</p>
                  <p className="text-sm text-muted-foreground">
                    查看学习数据和趋势
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
