/**
 * 邮箱验证页面
 * 用户通过邮件链接进入，携带 ?token=xxx 和可选 ?type=change-email
 * 挂载时自动发起验证请求
 */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiUrl } from "@/lib/utils";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("缺少验证链接，请从邮件中点击完整链接");
      return;
    }

    let cancelled = false;
    const verify = async () => {
      try {
        const params = new URLSearchParams({ token });
        if (type) params.set("type", type);
        const res = await fetch(
          apiUrl(`/api/auth/verify-email?${params.toString()}`)
        );
        const data = await res.json();

        if (cancelled) return;
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "验证成功");
        } else {
          setStatus("error");
          setMessage(data.error || "验证失败");
        }
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage("网络错误，请稍后重试");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, type]);

  // 加载中
  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">正在验证邮箱，请稍候…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 验证成功
  if (status === "success") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl">验证成功</CardTitle>
            <p className="text-sm text-muted-foreground">{message}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/profile">
              <Button className="w-full">前往个人中心</Button>
            </Link>
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                前往登录
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 验证失败
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl">验证失败</CardTitle>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardHeader>
        <CardContent>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              返回登录
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
