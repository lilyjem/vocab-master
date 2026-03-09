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
  Pencil,
  ChevronRight,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, apiUrl } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLearningData } from "@/lib/use-learning-data";
import { ACHIEVEMENT_META, type AchievementResult } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievements/achievement-card";
import type { UserSettings, WordOrderType } from "@/types";

/** 用户资料接口（从 API 返回） */
interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: boolean | Date | string | null;
  createdAt: string;
}

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

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 用户资料（登录用户）
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // 编辑昵称
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  // 邮箱验证
  const [verifyEmailLoading, setVerifyEmailLoading] = useState(false);
  const [verifyEmailError, setVerifyEmailError] = useState("");
  const [verifyEmailSuccess, setVerifyEmailSuccess] = useState(false);

  // 使用 useEffect 避免在渲染期间调用 set() 导致无限循环
  const [achievementResults, setAchievementResults] = useState<AchievementResult[]>([]);
  useEffect(() => {
    if (hydrated) {
      setAchievementResults(checkLocalAchievements());
    }
  }, [hydrated, wordProgress, dailyStats, sessions, checkLocalAchievements]);

  // 登录用户：获取个人资料（含邮箱验证状态）
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setProfileLoading(true);
    fetch(apiUrl("/api/user/profile"), { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.emailVerified !== undefined) {
          setUserProfile(data);
        }
      })
      .catch(() => {
        if (!cancelled) setUserProfile(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

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

  /** 重新发送验证邮件 */
  const handleResendVerifyEmail = async () => {
    setVerifyEmailError("");
    setVerifyEmailSuccess(false);
    setVerifyEmailLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/verify-email"), {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyEmailError(data.error || "发送失败");
        return;
      }
      setVerifyEmailSuccess(true);
      if (userProfile) setUserProfile({ ...userProfile, emailVerified: false });
    } catch {
      setVerifyEmailError("发送失败，请稍后重试");
    } finally {
      setVerifyEmailLoading(false);
    }
  };

  /** 开始编辑昵称 */
  const startEditName = () => {
    setNameValue(userProfile?.name ?? session?.user?.name ?? "");
    setNameError("");
    setEditingName(true);
  };

  /** 保存昵称 */
  const handleSaveName = async () => {
    setNameError("");
    setNameLoading(true);
    try {
      const res = await fetch(apiUrl("/api/user/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: nameValue.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error || "保存失败");
        return;
      }
      setUserProfile((p) => (p ? { ...p, name: data.name } : null));
      setEditingName(false);
    } catch {
      setNameError("保存失败，请稍后重试");
    } finally {
      setNameLoading(false);
    }
  };

  /** 取消编辑昵称 */
  const cancelEditName = () => {
    setEditingName(false);
    setNameValue("");
    setNameError("");
  };

  /** 检查邮箱是否已验证 */
  const isEmailVerified = userProfile?.emailVerified != null && userProfile.emailVerified !== false;

  /** 主题选项 */
  const themeOptions: { value: UserSettings["theme"]; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "浅色", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "深色", icon: <Moon className="h-4 w-4" /> },
    { value: "system", label: "跟随系统", icon: <Monitor className="h-4 w-4" /> },
  ];

  if (!hydrated) {
    return <LoadingSpinner />;
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
              {/* 昵称 + 编辑按钮（仅登录用户） */}
              {session && editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="昵称"
                    className="max-w-[200px]"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveName} disabled={nameLoading}>
                    {nameLoading ? "保存中…" : "保存"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEditName} disabled={nameLoading}>
                    取消
                  </Button>
                  {nameError && (
                    <span className="text-sm text-destructive">{nameError}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {userProfile?.name ?? session?.user?.name ?? "本地用户"}
                  </h2>
                  {session && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={startEditName}
                      aria-label="编辑昵称"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
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

      {/* 邮箱验证状态（仅登录且未验证时显示） */}
      {session && !profileLoading && !isEmailVerified && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              邮箱未验证
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerifyEmail}
              disabled={verifyEmailLoading}
            >
              {verifyEmailLoading ? "发送中…" : "重新发送验证邮件"}
            </Button>
          </div>
          {verifyEmailError && (
            <p className="text-sm text-destructive">{verifyEmailError}</p>
          )}
          {verifyEmailSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">
              验证邮件已发送，请查收
            </p>
          )}
        </div>
      )}

      {/* 账户安全入口（仅登录用户） */}
      {session && (
        <Link href="/profile/account" className="block">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">账户安全</p>
                  <p className="text-sm text-muted-foreground">
                    修改密码、修改邮箱、注销账户
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

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
                aria-label="减少"
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
                aria-label="增加"
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
                aria-label="减少"
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
                aria-label="增加"
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

          {/* 学习顺序 */}
          <div>
            <div className="mb-2">
              <p className="font-medium">学习顺序</p>
              <p className="text-sm text-muted-foreground">
                控制新词出现的先后顺序
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "freq-desc", label: "高频词优先", desc: "最常用的词先学" },
                  { value: "freq-asc", label: "低频词优先", desc: "跳过简单词，直接学难词" },
                  { value: "alpha", label: "字母顺序", desc: "A-Z 按字母排列" },
                  { value: "random", label: "随机顺序", desc: "每次随机打乱" },
                ] as { value: WordOrderType; label: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ wordOrder: opt.value })}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    settings.wordOrder === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
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
