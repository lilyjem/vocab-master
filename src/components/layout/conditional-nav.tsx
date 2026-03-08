/**
 * 条件导航组件 - 根据路径和登录状态控制导航栏显隐
 * 首页未登录时隐藏 Navbar 和 MobileNav（落地页自带导航）
 */
"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export function ConditionalNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // 首页 + 未登录（或加载中）→ 隐藏导航栏（落地页自带导航）
  const isLandingPage = pathname === "/" && !session && status !== "loading";

  if (isLandingPage) {
    return null;
  }

  return (
    <>
      <Navbar />
      <MobileNav />
    </>
  );
}
