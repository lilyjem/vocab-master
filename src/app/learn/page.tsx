/**
 * 学习中心页面 - 选择学习模式
 * 使用轻量 API (?ids=true) 只获取单词 ID 列表，加速页面加载
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  RotateCcw,
  Keyboard,
  ListChecks,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLearningData } from "@/lib/use-learning-data";
import { apiUrl } from "@/lib/utils";
import { preloadBookWords } from "@/lib/use-book-words";

/** 骨架屏：学习中心加载占位 */
function LearnPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="mt-2 h-5 w-64 bg-muted rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-24 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-6 w-20 bg-muted rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LearnPage() {
  const router = useRouter();
  const {
    hydrated,
    currentBookId,
    settings,
    getNewWordIds,
    getReviewWordIds,
  } = useLearningData();

  // 轻量数据：只需要 ID 列表和词库名
  const [wordIds, setWordIds] = useState<string[]>([]);
  const [bookName, setBookName] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentBookId) {
      setLoading(false);
      return;
    }
    // 使用轻量 API，只获取 ID 列表（数据量从数百 KB 降到几 KB）
    fetch(apiUrl(`/api/words/${currentBookId}?ids=true`))
      .then((res) => res.json())
      .then((data) => {
        setWordIds(Array.isArray(data?.wordIds) ? data.wordIds : []);
        setBookName(data?.name || "");
        setWordCount(data?.wordCount || 0);
        setLoading(false);
      })
      .catch(() => {
        setWordIds([]);
        setLoading(false);
      });

    // SWR preload：预取完整单词数据到全局缓存，子页面直接命中
    preloadBookWords(currentBookId);
  }, [currentBookId, hydrated]);

  // 骨架屏替代 spinner
  if (loading) {
    return <LearnPageSkeleton />;
  }

  // 未选择词库时提示
  if (!currentBookId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">尚未选择词库</h2>
        <p className="mt-2 text-muted-foreground">
          请先选择一个词库，然后再开始学习
        </p>
        <Link href="/wordbooks">
          <Button className="mt-6">
            <BookOpen className="mr-2 h-4 w-4" />
            去选择词库
          </Button>
        </Link>
      </div>
    );
  }

  // 获取全部新词和复习词数量用于统计展示（不限制数量）
  const newWordCount = getNewWordIds(wordIds, wordIds.length).length;
  const reviewWordCount = getReviewWordIds(wordIds, wordIds.length).length;

  /** 学习模式卡片配置 */
  const modes = [
    {
      href: "/learn/new",
      icon: BookOpen,
      title: "新词学习",
      description: "翻转卡片学习新单词，使用间隔重复记忆",
      count: Math.min(newWordCount, settings.dailyNewWords),
      total: newWordCount,
      color: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-500",
      badge: `${newWordCount} 个新词`,
    },
    {
      href: "/learn/review",
      icon: RotateCcw,
      title: "复习模式",
      description: "复习到期的单词，巩固记忆效果",
      count: Math.min(reviewWordCount, settings.dailyReviewWords),
      total: reviewWordCount,
      color: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-500",
      badge: `${reviewWordCount} 个待复习`,
    },
    {
      href: "/learn/spell",
      icon: Keyboard,
      title: "拼写测试",
      description: "看中文释义，拼写出英文单词",
      count: null,
      total: null,
      color: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-500",
      badge: "练习拼写",
    },
    {
      href: "/learn/quiz",
      icon: ListChecks,
      title: "选择题",
      description: "四选一快速测试，检验词汇掌握",
      count: null,
      total: null,
      color: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-500",
      badge: "快速测验",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">学习中心</h1>
        <p className="mt-1 text-muted-foreground">
          当前词库：<span className="font-medium text-foreground">{bookName}</span>
          <span className="ml-2">· {wordCount} 个单词</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link key={mode.href} href={mode.href}>
              <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${mode.color}`}
                    >
                      <Icon className={`h-6 w-6 ${mode.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{mode.title}</h3>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {mode.description}
                      </p>
                      <div className="mt-3">
                        <Badge variant="secondary">{mode.badge}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
