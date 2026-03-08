/**
 * 词库列表页面 - 展示所有可用词库
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLearningData } from "@/lib/use-learning-data";
import type { WordBook } from "@/types";
import { apiUrl } from "@/lib/utils";

/** 难度等级标签映射 */
const LEVEL_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  beginner: { label: "初级", variant: "secondary" },
  intermediate: { label: "中级", variant: "default" },
  advanced: { label: "高级", variant: "destructive" },
};

export default function WordBooksPage() {
  const [books, setBooks] = useState<WordBook[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentBookId } = useLearningData();

  useEffect(() => {
    fetch(apiUrl("/api/words"))
      .then((res) => res.json())
      .then((data) => {
        // 确保 API 返回的数据是数组，防止错误对象导致 .map 崩溃
        setBooks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setBooks([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">加载词库中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">词库选择</h1>
        <p className="text-muted-foreground mt-1">
          选择一个词库开始学习，共 {books.length} 个词库可用
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => {
          const level = LEVEL_MAP[book.level] || LEVEL_MAP.beginner;
          const isCurrentBook = book.id === currentBookId;

          return (
            <Link key={book.id} href={`/wordbooks/${book.id}`}>
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  isCurrentBook ? "ring-2 ring-primary" : ""
                }`}
              >
                {/* 顶部色带 */}
                <div
                  className="h-2 rounded-t-xl"
                  style={{ backgroundColor: book.coverColor }}
                />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${book.coverColor}20` }}
                      >
                        <BookOpen
                          className="h-5 w-5"
                          style={{ color: book.coverColor }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{book.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {book.wordCount} 个单词
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={level.variant}>{level.label}</Badge>
                      {isCurrentBook && (
                        <Badge variant="outline" className="text-primary border-primary">
                          当前
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {book.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>点击查看详情</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {books.length === 0 && (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="mt-4 text-lg font-semibold">暂无词库</h3>
          <p className="mt-2 text-muted-foreground">
            请先运行 npm run db:seed 导入词库数据
          </p>
        </div>
      )}
    </div>
  );
}
