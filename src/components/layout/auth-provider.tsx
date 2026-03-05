/**
 * NextAuth SessionProvider 包装组件
 * 为客户端提供认证会话上下文，支持 basePath 子路径部署
 * 内嵌 SyncProvider 实现登录时自动同步学习进度
 */
"use client";

import { SessionProvider } from "next-auth/react";
import { SyncProvider } from "./sync-provider";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return (
    <SessionProvider basePath={`${basePath}/api/auth`}>
      <SyncProvider>{children}</SyncProvider>
    </SessionProvider>
  );
}
