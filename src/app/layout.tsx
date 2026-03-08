/**
 * 根布局 - 全站通用布局结构
 * 导航栏和主内容区根据页面和登录状态条件渲染
 */
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/components/layout/auth-provider";
import { ConditionalNav } from "@/components/layout/conditional-nav";
import { ConditionalMain } from "@/components/layout/conditional-main";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://bairihuizhan.online/vocab";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "VocabMaster - 智能英语词汇学习平台",
    template: "%s | VocabMaster",
  },
  description:
    "基于 SM-2 间隔重复算法的智能英语词汇学习平台。支持 CET-4/6、考研、雅思、托福、GRE 六大词库，提供翻转卡片、拼写测试、选择题等多种学习模式。",
  keywords: [
    "英语学习", "背单词", "词汇学习", "VocabMaster",
    "CET-4", "CET-6", "考研英语", "雅思", "托福", "GRE",
    "间隔重复", "SM-2", "在线背单词", "英语词汇",
  ],
  authors: [{ name: "VocabMaster" }],
  creator: "VocabMaster",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "VocabMaster",
    title: "VocabMaster - 智能英语词汇学习平台",
    description:
      "基于 SM-2 间隔重复算法，支持 CET-4/6、考研、雅思、托福、GRE 六大词库。翻转卡片、拼写测试、选择题多种模式，科学高效背单词。",
  },
  twitter: {
    card: "summary",
    title: "VocabMaster - 智能英语词汇学习平台",
    description:
      "基于 SM-2 间隔重复算法，支持六大词库，科学高效背单词。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD 结构化数据：让 Google 识别为教育类 Web 应用
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "VocabMaster",
    url: SITE_URL,
    description:
      "基于 SM-2 间隔重复算法的智能英语词汇学习平台，支持 CET-4/6、考研、雅思、托福、GRE 六大词库。",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
    },
    inLanguage: ["zh-CN", "en"],
  };

  return (
    <html lang="zh-CN" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
