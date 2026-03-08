/**
 * 根布局 - 全站通用布局结构
 * 导航栏和主内容区根据页面和登录状态条件渲染
 */
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/components/layout/auth-provider";
import { ConditionalNav } from "@/components/layout/conditional-nav";
import { ConditionalMain } from "@/components/layout/conditional-main";
import "./globals.css";

export const metadata: Metadata = {
  title: "VocabMaster - 英语词汇学习",
  description: "基于 SM-2 间隔重复算法的智能英语词汇学习平台",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConditionalNav />
            <ConditionalMain>{children}</ConditionalMain>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
