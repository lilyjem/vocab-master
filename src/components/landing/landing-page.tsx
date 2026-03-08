/**
 * 落地页组件 - 未登录用户看到的产品介绍页
 * 包含 Hero 区、交互演示、核心特性、底部 CTA
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  BarChart3,
  Keyboard,
  ListChecks,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

/** 演示用的单词数据 */
const DEMO_WORDS = [
  { word: "ephemeral", phonetic: "/ɪˈfemərəl/", definition: "adj. 短暂的；转瞬即逝的" },
  { word: "serendipity", phonetic: "/ˌserənˈdɪpəti/", definition: "n. 意外发现美好事物的运气" },
  { word: "resilience", phonetic: "/rɪˈzɪliəns/", definition: "n. 恢复力；韧性；弹性" },
  { word: "eloquent", phonetic: "/ˈeləkwənt/", definition: "adj. 雄辩的；有口才的" },
  { word: "ubiquitous", phonetic: "/juːˈbɪkwɪtəs/", definition: "adj. 无处不在的；普遍存在的" },
];

/** 浮动单词气泡 */
const FLOATING_WORDS = [
  "hello", "world", "dream", "learn", "think",
  "create", "grow", "focus", "brave", "shine",
  "wisdom", "spark", "quest", "bloom", "swift",
];

/** Hero 区背景浮动气泡 */
function FloatingBubbles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {FLOATING_WORDS.map((word, i) => (
        <span
          key={word}
          className="absolute text-primary/[0.07] dark:text-primary/[0.1] font-bold select-none"
          style={{
            fontSize: `${14 + (i % 5) * 6}px`,
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 23 + 10) % 90}%`,
            animation: `float-bubble ${8 + (i % 4) * 3}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

/** 交互式翻转卡片演示 */
function DemoCard() {
  const [flipped, setFlipped] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  const current = DEMO_WORDS[wordIndex];

  /** 翻转后 2 秒自动切换下一个词 */
  useEffect(() => {
    if (!flipped) return;
    const timer = setTimeout(() => {
      setFlipped(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % DEMO_WORDS.length);
      }, 400);
    }, 2500);
    return () => clearTimeout(timer);
  }, [flipped]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-full max-w-sm cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* 正面 - 英文单词 */}
          <div
            className="rounded-2xl border-2 border-primary/20 bg-card p-8 text-center shadow-xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-3xl font-bold tracking-tight">{current.word}</p>
            <p className="mt-2 text-sm text-muted-foreground">{current.phonetic}</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              <span>点击翻转查看释义</span>
            </div>
          </div>

          {/* 背面 - 中文释义 */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 text-center shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-lg font-medium text-muted-foreground">{current.word}</p>
            <div className="my-4 h-px bg-border" />
            <p className="text-xl font-semibold">{current.definition}</p>
          </div>
        </div>
      </div>

      {/* 卡片指示器 */}
      <div className="flex gap-1.5">
        {DEMO_WORDS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === wordIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** 核心特性列表 */
const FEATURES = [
  {
    icon: Brain,
    title: "SM-2 间隔重复",
    description: "基于科学记忆曲线，智能安排每个单词的最佳复习时间，让记忆更持久",
    color: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-500",
  },
  {
    icon: ListChecks,
    title: "多种学习模式",
    description: "翻转卡片、拼写测试、选择题、复习模式，多维度巩固词汇记忆",
    color: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-500",
  },
  {
    icon: BarChart3,
    title: "学习数据追踪",
    description: "可视化学习进度、连续打卡天数、成就系统，让学习更有动力",
    color: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-500",
  },
  {
    icon: BookOpen,
    title: "丰富词库资源",
    description: "CET-4、CET-6 等主流词库，按词频排序优先学习高频词汇",
    color: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-500",
  },
  {
    icon: RotateCcw,
    title: "跨设备同步",
    description: "登录后数据云端存储，手机、平板、电脑随时随地继续学习",
    color: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-500",
  },
  {
    icon: Keyboard,
    title: "例句与词源",
    description: "每个单词配有真实例句和中文翻译，词根词缀分析帮助深度理解",
    color: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-500",
  },
];

export function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen">
      {/* 落地页自带的简洁导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">VocabMaster</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">切换主题</span>
            </Button>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">登录</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">免费注册</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Hero 区 ===== */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden pt-16">
        <FloatingBubbles />
        {/* 渐变背景装饰 */}
        <div
          className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            基于 SM-2 间隔重复算法
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            掌握词汇
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              从科学记忆开始
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            告别死记硬背，用科学的间隔重复算法安排复习节奏。
            <br className="hidden sm:block" />
            多种学习模式，让每个单词都记得牢、用得上。
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="gap-2 px-8 text-base">
                免费开始学习
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="px-8 text-base">
                已有账号，去登录
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 交互演示区 ===== */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              体验翻转学习
            </h2>
            <p className="mt-3 text-muted-foreground">
              点击卡片翻转查看释义，这就是你每天学习的方式
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <DemoCard />
          </div>
        </div>
      </section>

      {/* ===== 核心特性区 ===== */}
      <section className="border-t border-border/50 bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              为什么选择 VocabMaster
            </h2>
            <p className="mt-3 text-muted-foreground">
              科学方法 + 丰富功能，让词汇学习事半功倍
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 底部 CTA ===== */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            准备好开始你的词汇之旅了吗？
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            完全免费，注册即可开始科学记忆单词
          </p>
          <div className="mt-8">
            <Link href="/auth/register">
              <Button size="lg" className="gap-2 px-10 text-base">
                立即注册，免费使用
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 页脚 ===== */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} VocabMaster. 用科学方法记单词。</p>
        </div>
      </footer>
    </div>
  );
}
