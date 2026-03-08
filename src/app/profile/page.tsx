/**
 * 个人中心页面 - 用户设置、数据管理、登录状态
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { cn, apiUrl } from "@/lib/utils";
import { useLearningData } from "@/lib/use-learning-data";
import { ACHIEVEMENT_META, type AchievementResult } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievements/achievement-card";
import type { UserSettings } from "@/types";

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
  const router = useRouter();
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

  // 修改密码
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 修改邮箱
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailNew, setEmailNew] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);

  // 注销账户
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  /** 修改密码 */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    if (passwordNew !== passwordConfirm) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }
    if (passwordNew.length < 6) {
      setPasswordError("新密码至少 6 个字符");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch(apiUrl("/api/user/password"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordCurrent,
          newPassword: passwordNew,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "修改失败");
        return;
      }
      setPasswordSuccess(true);
      setPasswordCurrent("");
      setPasswordNew("");
      setPasswordConfirm("");
    } catch {
      setPasswordError("修改失败，请稍后重试");
    } finally {
      setPasswordLoading(false);
    }
  };

  /** 修改邮箱 */
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess(false);
    setEmailLoading(true);
    try {
      const res = await fetch(apiUrl("/api/user/change-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: emailPassword, newEmail: emailNew.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "修改失败");
        return;
      }
      setEmailSuccess(true);
      setEmailPassword("");
      setEmailNew("");
    } catch {
      setEmailError("修改失败，请稍后重试");
    } finally {
      setEmailLoading(false);
    }
  };

  /** 注销账户 */
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const res = await fetch(apiUrl("/api/user/account"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "注销失败");
        return;
      }
      await signOut({ redirect: false });
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      router.push(`${basePath}/` || "/");
      router.refresh();
    } catch {
      setDeleteError("注销失败，请稍后重试");
    } finally {
      setDeleteLoading(false);
    }
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

      {/* 修改密码（仅登录用户） */}
      {session && (
        <Card>
          <button
            type="button"
            className="w-full"
            onClick={() => setPasswordOpen(!passwordOpen)}
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 rounded-t-lg">
              <CardTitle className="text-base">修改密码</CardTitle>
              {passwordOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {passwordOpen && (
            <CardContent className="pt-0">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password-current">
                    当前密码
                  </label>
                  <Input
                    id="password-current"
                    type="password"
                    placeholder="请输入当前密码"
                    value={passwordCurrent}
                    onChange={(e) => setPasswordCurrent(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password-new">
                    新密码
                  </label>
                  <Input
                    id="password-new"
                    type="password"
                    placeholder="至少 6 位"
                    value={passwordNew}
                    onChange={(e) => setPasswordNew(e.target.value)}
                    minLength={6}
                    required
                  />
                  <PasswordStrength password={passwordNew} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password-confirm">
                    确认新密码
                  </label>
                  <Input
                    id="password-confirm"
                    type="password"
                    placeholder="再次输入新密码"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">密码修改成功</p>
                )}
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? "提交中…" : "提交"}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      {/* 修改邮箱（仅登录用户） */}
      {session && (
        <Card>
          <button
            type="button"
            className="w-full"
            onClick={() => setEmailOpen(!emailOpen)}
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 rounded-t-lg">
              <CardTitle className="text-base">修改邮箱</CardTitle>
              {emailOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {emailOpen && (
            <CardContent className="pt-0">
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email-password">
                    当前密码
                  </label>
                  <Input
                    id="email-password"
                    type="password"
                    placeholder="请输入当前密码"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email-new">
                    新邮箱
                  </label>
                  <Input
                    id="email-new"
                    type="email"
                    placeholder="new@example.com"
                    value={emailNew}
                    onChange={(e) => setEmailNew(e.target.value)}
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
                {emailSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    验证邮件已发送到新邮箱，请查收
                  </p>
                )}
                <Button type="submit" disabled={emailLoading}>
                  {emailLoading ? "提交中…" : "提交"}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      {/* 注销账户（仅登录用户，危险区域） */}
      {session && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive text-base">注销账户</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              此操作不可逆，将删除您的账户及所有学习数据
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="delete-password">
                  请输入密码确认
                </label>
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="当前密码"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                />
              </div>
              {deleteError && (
                <p className="text-sm text-destructive">{deleteError}</p>
              )}
              <Button type="submit" variant="destructive" disabled={deleteLoading}>
                {deleteLoading ? "注销中…" : "确认注销"}
              </Button>
            </form>
          </CardContent>
        </Card>
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
