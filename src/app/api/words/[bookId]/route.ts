/**
 * 指定词库详情 API
 * GET /api/words/:bookId - 获取词库信息及其单词列表
 *
 * 查询参数:
 * - page: 页码（从 1 开始，默认 1）
 * - pageSize: 每页条数（默认 50，最大 200）
 * - search: 搜索关键词（可选，模糊匹配单词或释义）
 * - all: 设为 "true" 返回全部单词（用于学习模式，不分页）
 * - ids: 设为 "true" 只返回单词 ID 列表和词库名（轻量模式，用于学习中心统计）
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiCache, TTL_WORDS_MS } from "@/lib/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const returnAll = searchParams.get("all") === "true";
    const returnIds = searchParams.get("ids") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") || "50")));
    const search = searchParams.get("search") || "";

    // 缓存 key 包含查询参数，区分不同查询
    const cacheKey = `words:${params.bookId}:all:${returnAll}:ids:${returnIds}:page:${page}:pageSize:${pageSize}:search:${search}`;

    // 尝试从缓存读取（10 分钟 TTL）
    const cached = apiCache.get<Record<string, unknown>>(cacheKey);
    if (cached !== undefined) {
      return NextResponse.json(cached);
    }

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

    let result: Record<string, unknown>;

    if (returnIds) {
      // 轻量模式：只返回 ID 列表和词库名（用于学习中心统计，数据量极小）
      const wordIds = await prisma.word.findMany({
        where,
        select: { id: true },
        orderBy: { frequency: "desc" },
      });
      result = { name: book.name, wordCount: wordIds.length, wordIds: wordIds.map((w) => w.id) };
    } else if (returnAll) {
      // 学习模式：按词频降序返回全部单词（高频词优先学习）
      const words = await prisma.word.findMany({
        where,
        orderBy: { frequency: "desc" },
      });
      result = { ...book, words };
    } else {
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
      result = {
        ...book,
        words,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      };
    }

    apiCache.set(cacheKey, result, TTL_WORDS_MS);
    return NextResponse.json(result);
  } catch (error) {
    console.error("获取词库详情失败:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
