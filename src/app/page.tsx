/**
 * 首页 - 根据登录状态展示不同内容
 * 未登录 → 落地页（产品介绍 + 引导注册）
 * 已登录 → 仪表盘（学习概况 + 快捷入口）
 */
"use client";

import { useSession } from "next-auth/react";
import { LandingPage } from "@/components/landing/landing-page";
import { Dashboard } from "@/components/dashboard/dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function HomePage() {
  const { data: session, status } = useSession();

  // 认证状态加载中时显示 spinner
  if (status === "loading") {
    return <LoadingSpinner />;
  }

  // 未登录 → 落地页
  if (!session) {
    return <LandingPage />;
  }

  // 已登录 → 仪表盘
  return <Dashboard />;
}
