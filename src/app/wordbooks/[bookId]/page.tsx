/**
 * 词库详情页面 - 展示词库信息和单词列表（支持分页和搜索）
 */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Play,
  Search,
  Volume2,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useLearningData } from "@/lib/use-learning-data";
import { playWordAudio } from "@/lib/audio";
import type { Word, WordBook } from "@/types";
import { percentage, apiUrl } from "@/lib/utils";

/** 单词状态对应颜色 */
const STATUS_COLORS: Record<string, string> = {
  new: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  learning: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  review: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  mastered: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_LABELS: Record<string, string> = {
  new: "新词",
  learning: "学习中",
  review: "复习中",
  mastered: "已掌握",
};

const PAGE_SIZE = 50;

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<WordBook | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    setCurrentBook,
    currentBookId,
    getWordStatusCounts,
    wordProgress: wordProgressMap,
    settings,
  } = useLearningData();
  const pronunciation = settings.pronunciation;

  // 虚拟列表：滚动容器 ref，用于 useVirtualizer 计算可视区域
  const parentRef = useRef<HTMLDivElement>(null);

  // 虚拟列表：行虚拟化器，只渲染可视区域内的单词行，每行预估高度 64px
  const rowVirtualizer = useVirtualizer({
    count: words.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
  });

  /** 加载单词数据（分页） */
  const fetchWords = useCallback(async (page: number, search: string) => {
    setWordsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      if (search) params.set("search", search);

      const res = await fetch(apiUrl(`/api/words/${bookId}?${params}`));
      const data = await res.json();

      if (data.error) {
        router.push("/wordbooks");
        return;
      }

      if (!book) setBook(data);
      setWords(Array.isArray(data?.words) ? data.words : []);
      setPagination(data?.pagination || null);
    } catch {
      setWords([]);
    } finally {
      setWordsLoading(false);
      setLoading(false);
    }
  }, [bookId, book, router]);

  // 初始加载
  useEffect(() => {
    fetchWords(1, "");
  }, [bookId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 翻页时重新加载
  useEffect(() => {
    if (!loading) {
      fetchWords(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 搜索防抖处理 */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  if (loading || !book) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const wordIds = words.map((w) => w.id);
  const statusCounts = getWordStatusCounts(wordIds);
  const isCurrentBook = currentBookId === bookId;

  const totalWords = pagination?.totalCount || words.length;
  const learnedCount = statusCounts.learning + statusCounts.review + statusCounts.mastered;
  const progressPercent = percentage(learnedCount, totalWords);

  /** 播放单词发音（有道词典 TTS，真正区分美式/英式） */
  const playAudio = (word: string) => {
    playWordAudio(word, pronunciation);
  };

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={() => router.push("/wordbooks")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回词库列表
      </Button>

      {/* 词库信息卡片 */}
      <Card>
        <div className="h-2 rounded-t-xl" style={{ backgroundColor: book.coverColor }} />
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${book.coverColor}20` }}
              >
                <BookOpen className="h-7 w-7" style={{ color: book.coverColor }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{book.name}</h1>
                <p className="mt-1 text-muted-foreground">{book.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">{totalWords} 个单词</Badge>
                  {isCurrentBook && (
                    <Badge variant="outline" className="text-primary border-primary">
                      当前学习
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isCurrentBook ? (
                <Button onClick={() => setCurrentBook(bookId)}>
                  <Check className="mr-2 h-4 w-4" />
                  设为当前词库
                </Button>
              ) : (
                <Link href="/learn">
                  <Button>
                    <Play className="mr-2 h-4 w-4" />
                    开始学习
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* 学习进度 */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">学习进度</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <span className="block text-lg font-bold text-gray-500">{statusCounts.new}</span>
                <span className="text-muted-foreground">新词</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-blue-500">{statusCounts.learning}</span>
                <span className="text-muted-foreground">学习中</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-amber-500">{statusCounts.review}</span>
                <span className="text-muted-foreground">复习中</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-green-500">{statusCounts.mastered}</span>
                <span className="text-muted-foreground">已掌握</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 单词列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>单词列表</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索单词或释义..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {wordsLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* 无单词时显示空状态 */}
              {words.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  {searchTerm ? "没有找到匹配的单词" : "词库中暂无单词"}
                </div>
              ) : (
                /* 虚拟列表：固定高度滚动容器，overflow-y 启用垂直滚动 */
                <div
                  ref={parentRef}
                  className="max-h-[600px] overflow-y-auto overflow-x-hidden rounded-md border border-border"
                >
                  {/* 虚拟列表：占位容器，高度为所有行的总高度，用于正确计算滚动条 */}
                  <div
                    className="relative w-full"
                    style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                  >
                    {/* 虚拟列表：仅渲染可视区域内的行，每行绝对定位 + translateY 实现虚拟滚动 */}
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const word = words[virtualRow.index];
                      const progress = wordProgressMap[word.id];
                      const status = progress?.status || "new";

                      return (
                        <div
                          key={word.id}
                          className="flex items-center gap-4 py-3 hover:bg-muted/50 px-2 rounded-md transition-colors border-b border-border"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <button
                            onClick={() => playAudio(word.word)}
                            aria-label={`播放 ${word.word} 的发音`}
                            className="flex-shrink-0 rounded-full p-1.5 hover:bg-muted transition-colors"
                          >
                            <Volume2 className="h-4 w-4 text-muted-foreground" />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{word.word}</span>
                              {word.phonetic && (
                                <span className="text-sm text-muted-foreground">{word.phonetic}</span>
                              )}
                              {word.partOfSpeech && (
                                <span className="text-xs text-muted-foreground">{word.partOfSpeech}</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {word.definition}
                            </p>
                          </div>

                          <span
                            className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
                          >
                            {STATUS_LABELS[status]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 分页控件 */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t mt-4">
                  <span className="text-sm text-muted-foreground">
                    共 {pagination.totalCount} 个单词，第 {pagination.page}/{pagination.totalPages} 页
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= pagination.totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
