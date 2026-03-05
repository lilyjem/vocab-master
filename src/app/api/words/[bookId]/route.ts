/**
 * 指定词库详情 API
 * GET /api/words/:bookId - 获取词库信息及其单词列表
 *
 * 查询参数:
 * - page: 页码（从 1 开始，默认 1）
 * - pageSize: 每页条数（默认 50，最大 200）
 * - search: 搜索关键词（可选，模糊匹配单词或释义）
 * - all: 设为 "true" 返回全部单词（用于学习模式，不分页）
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const returnAll = searchParams.get("all") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") || "50")));
    const search = searchParams.get("search") || "";

    const book = await prisma.wordBook.findUnique({
      where: { id: params.bookId },
    });

    if (!book) {
      return NextResponse.json(
        { error: "词库不存在" },
        { status: 404 }
      );
    }

    // 构建查询条件
    const where: Record<string, unknown> = { bookId: params.bookId };
    if (search) {
      where.OR = [
        { word: { contains: search, mode: "insensitive" } },
        { definition: { contains: search } },
      ];
    }

    if (returnAll) {
      // 学习模式：返回全部单词（不分页）
      const words = await prisma.word.findMany({
        where,
        orderBy: { word: "asc" },
      });
      return NextResponse.json({ ...book, words });
    }

    // 分页模式
    const [words, totalCount] = await Promise.all([
      prisma.word.findMany({
        where,
        orderBy: { word: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.word.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      ...book,
      words,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("获取词库详情失败:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
