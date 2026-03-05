/**
 * 词库和单词 API
 * GET /api/words - 获取所有词库列表
 * GET /api/words?bookId=xxx - 获取指定词库的单词列表
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  try {
    if (bookId) {
      // 获取指定词库的所有单词
      const words = await prisma.word.findMany({
        where: { bookId },
        orderBy: { word: "asc" },
      });
      return NextResponse.json(words);
    }

    // 获取所有词库列表
    const books = await prisma.wordBook.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(books);
  } catch (error) {
    console.error("获取词库数据失败:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
