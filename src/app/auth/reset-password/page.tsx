/**
 * 重置密码页面
 * 用户通过邮件链接进入，携带 ?token=xxx 参数
 */
"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Lock, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrength } from "@/components/ui/password-strength";
import { apiUrl } from "@/lib/utils";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("缺少重置链接，请重新从邮件中点击链接");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (newPassword.length < 6) {
      setError("密码至少 6 个字符");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "密码重置失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 无 token 时提示
  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="mt-4 text-2xl">链接无效</CardTitle>
            <p className="text-sm text-muted-foreground">
              请从密码重置邮件中点击完整链接，或重新申请重置。
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/auth/forgot-password">
              <Button className="w-full">重新申请重置</Button>
            </Link>
            <div className="mt-4 text-center text-sm">
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                返回登录
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 重置成功
  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <Lock className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl">密码已重置</CardTitle>
            <p className="text-sm text-muted-foreground">
              密码重置成功，请使用新密码登录。
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                前往登录
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 表单
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="mt-4 text-2xl">设置新密码</CardTitle>
          <p className="text-sm text-muted-foreground">
            请输入并确认您的新密码（至少 6 位）
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="newPassword">
                新密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="至少6位密码"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
              <PasswordStrength password={newPassword} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              重置密码
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              返回登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
