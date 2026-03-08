/**
 * 条件主内容区 - 落地页使用全宽布局，其他页面使用带 padding 的居中布局
 */
"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // 首页 + 未登录 → 全宽布局（落地页）
  const isLandingPage = pathname === "/" && !session;

  if (isLandingPage) {
    return <main>{children}</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 md:pb-6 lg:px-8">
      {children}
    </main>
  );
}
