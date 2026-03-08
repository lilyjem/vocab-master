/**
 * 个人中心页面 - 用户设置、数据管理、登录状态
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Settings,
  LogIn,
  LogOut,
  Cloud,
  Trash2,
  Download,
  Sun,
  Moon,
  Monitor,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLearningData } from "@/lib/use-learning-data";
import { ACHIEVEMENT_META, type AchievementResult } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievements/achievement-card";
import type { UserSettings } from "@/types";

export default function ProfilePage() {
  const { data: session } = useSession();
  const {
    hydrated,
    settings,
    updateSettings,
    clearAllData,
    exportData,
    checkLocalAchievements,
    wordProgress,
    dailyStats,
    sessions,
    getStreak,
  } = useLearningData();

  const [syncing, setSyncing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 使用 useEffect 避免在渲染期间调用 set() 导致无限循环
  const [achievementResults, setAchievementResults] = useState<AchievementResult[]>([]);
  useEffect(() => {
    if (hydrated) {
      setAchievementResults(checkLocalAchievements());
    }
  }, [hydrated, wordProgress, dailyStats, sessions, checkLocalAchievements]);

  const streak = getStreak();
  const totalLearned = Object.values(wordProgress).filter(
    (p) => p.status !== "new"
  ).length;
  const totalMastered = Object.values(wordProgress).filter(
    (p) => p.status === "mastered"
  ).length;

  /** 导出学习数据为 JSON 文件 */
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocabmaster-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** 清除所有数据 */
  const handleClear = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  /** 主题选项 */
  const themeOptions: { value: UserSettings["theme"]; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "浅色", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "深色", icon: <Moon className="h-4 w-4" /> },
    { value: "system", label: "跟随系统", icon: <Monitor className="h-4 w-4" /> },
  ];

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">个人中心</h1>

      {/* 用户信息卡片 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {session?.user?.name || "本地用户"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {session?.user?.email || "数据存储在本地浏览器中"}
              </p>
              <div className="mt-2 flex gap-2">
                <Badge variant="secondary">已学 {totalLearned} 词</Badge>
                <Badge variant="secondary">已掌握 {totalMastered} 词</Badge>
                <Badge variant="secondary">连续 {streak} 天</Badge>
              </div>
            </div>
            {session ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/` })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </Button>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  登录同步
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 成就 */}
      <Card id="achievements">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            成就
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {achievementResults.map((r) => {
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
        </CardContent>
      </Card>

      {/* 学习设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            学习设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 每日新词数量 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">每日新词数量</p>
              <p className="text-sm text-muted-foreground">每天学习多少个新单词</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  updateSettings({
                    dailyNewWords: Math.max(5, settings.dailyNewWords - 5),
                  })
                }
              >
                -
              </Button>
              <span className="w-12 text-center font-bold text-lg">
                {settings.dailyNewWords}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  updateSettings({
                    dailyNewWords: Math.min(100, settings.dailyNewWords + 5),
                  })
                }
              >
                +
              </Button>
            </div>
          </div>

          {/* 每日复习数量 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">每日复习数量</p>
              <p className="text-sm text-muted-foreground">每天复习多少个单词</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  updateSettings({
                    dailyReviewWords: Math.max(10, settings.dailyReviewWords - 10),
                  })
                }
              >
                -
              </Button>
              <span className="w-12 text-center font-bold text-lg">
                {settings.dailyReviewWords}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  updateSettings({
                    dailyReviewWords: Math.min(200, settings.dailyReviewWords + 10),
                  })
                }
              >
                +
              </Button>
            </div>
          </div>

          {/* 发音类型 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">发音类型</p>
              <p className="text-sm text-muted-foreground">选择美式或英式英语发音</p>
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => updateSettings({ pronunciation: "en-US" })}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  settings.pronunciation === "en-US"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
              >
                美式
              </button>
              <button
                onClick={() => updateSettings({ pronunciation: "en-GB" })}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  settings.pronunciation === "en-GB"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
              >
                英式
              </button>
            </div>
          </div>

          {/* 自动播放发音 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">自动播放发音</p>
              <p className="text-sm text-muted-foreground">翻转卡片时自动播放单词发音</p>
            </div>
            <button
              onClick={() =>
                updateSettings({ autoPlayAudio: !settings.autoPlayAudio })
              }
              role="switch"
              aria-checked={settings.autoPlayAudio}
              aria-label="自动播放发音"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoPlayAudio ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.autoPlayAudio ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 显示音标 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">显示音标</p>
              <p className="text-sm text-muted-foreground">在卡片正面显示单词音标</p>
            </div>
            <button
              onClick={() =>
                updateSettings({ showPhonetic: !settings.showPhonetic })
              }
              role="switch"
              aria-checked={settings.showPhonetic}
              aria-label="显示音标"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showPhonetic ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.showPhonetic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 数据管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            数据管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            导出学习数据
          </Button>

          {!showClearConfirm ? (
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              清除所有学习数据
            </Button>
          ) : (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                确定要清除所有学习数据吗？此操作不可恢复！
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClear}
                >
                  确定清除
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearConfirm(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
