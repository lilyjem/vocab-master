/**
 * 词库和单词 API
 * GET /api/words - 获取所有词库列表
 * GET /api/words?bookId=xxx - 获取指定词库的单词列表
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiCache, TTL_BOOKS_MS } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  // 构建缓存 key（含查询参数以区分不同请求）
  const cacheKey = bookId ? `words:bookId:${bookId}` : "words:books";

  try {
    // 尝试从缓存读取（5 分钟 TTL，减轻数据库压力）
    const cached = apiCache.get<unknown>(cacheKey);
    if (cached !== undefined) {
      return NextResponse.json(cached);
    }

    if (bookId) {
      // 获取指定词库的所有单词
      const words = await prisma.word.findMany({
        where: { bookId },
        orderBy: { word: "asc" },
      });
      apiCache.set(cacheKey, words, TTL_BOOKS_MS);
      return NextResponse.json(words);
    }

    // 获取所有词库列表
    const books = await prisma.wordBook.findMany({
      orderBy: { sortOrder: "asc" },
    });
    apiCache.set(cacheKey, books, TTL_BOOKS_MS);
    return NextResponse.json(books);
  } catch (error) {
    console.error("获取词库数据失败:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
