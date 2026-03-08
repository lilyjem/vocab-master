/**
 * 账户安全页面 - 修改密码、修改邮箱、注销账户
 * 从个人中心拆分出来，减少页面内容密度
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ArrowLeft, KeyRound, Mail, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { apiUrl } from "@/lib/utils";

export default function AccountSecurityPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // 修改密码
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 修改邮箱
  const [emailPassword, setEmailPassword] = useState("");
  const [emailNew, setEmailNew] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);

  // 注销账户
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // 未登录用户重定向
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">请先登录</p>
        <Link href="/auth/login">
          <Button>去登录</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 返回按钮 + 标题 */}
      <div className="flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">账户安全</h1>
      </div>

      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5" />
            修改密码
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              {passwordLoading ? "提交中…" : "修改密码"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 修改邮箱 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5" />
            修改邮箱
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            当前邮箱：{session.user?.email}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email-password">
                当前密码
              </label>
              <Input
                id="email-password"
                type="password"
                placeholder="请输入当前密码验证身份"
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
                验证邮件已发送到新邮箱，请查收并点击确认链接
              </p>
            )}
            <Button type="submit" disabled={emailLoading}>
              {emailLoading ? "提交中…" : "修改邮箱"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 注销账户 */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-5 w-5" />
            注销账户
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            此操作不可逆，将永久删除您的账户及所有学习数据（学习进度、每日统计、成就等）。
          </p>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              我要注销账户
            </Button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                请输入密码确认注销
              </p>
              <Input
                id="delete-password"
                type="password"
                placeholder="当前密码"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
              {deleteError && (
                <p className="text-sm text-destructive">{deleteError}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" variant="destructive" disabled={deleteLoading}>
                  {deleteLoading ? "注销中…" : "确认注销"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                >
                  取消
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
