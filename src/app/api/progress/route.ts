/**
 * 学习进度同步 API
 * GET  /api/progress - 获取用户的学习进度（返回 Record<wordId, progress> 格式）
 * POST /api/progress - 同步本地学习进度到云端（支持 updatedAt 冲突检测）
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET: 拉取云端全部进度，返回 { [wordId]: LocalWordProgress } */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const rows = await prisma.userWordProgress.findMany({
      where: { userId },
    });

    // 转换为前端 LocalWordProgress 字典格式
    const result: Record<string, {
      wordId: string;
      repetitions: number;
      easinessFactor: number;
      interval: number;
      nextReviewDate: string;
      totalReviews: number;
      correctCount: number;
      status: string;
      updatedAt: string;
    }> = {};

    for (const row of rows) {
      result[row.wordId] = {
        wordId: row.wordId,
        repetitions: row.repetitions,
        easinessFactor: row.easinessFactor,
        interval: row.interval,
        nextReviewDate: row.nextReviewDate.toISOString(),
        totalReviews: row.totalReviews,
        correctCount: row.correctCount,
        status: row.status,
        updatedAt: row.updatedAt.toISOString(),
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("获取进度失败:", error);
    return NextResponse.json(
      { error: "获取进度失败" },
      { status: 500 }
    );
  }
}

/** POST: 接收 { wordProgress: { [wordId]: progress } }，带 updatedAt 冲突检测 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { wordProgress } = await request.json();

    if (!wordProgress || typeof wordProgress !== "object") {
      return NextResponse.json(
        { error: "无效的进度数据" },
        { status: 400 }
      );
    }

    const entries = Object.entries(wordProgress) as [string, {
      wordId: string;
      repetitions: number;
      easinessFactor: number;
      interval: number;
      nextReviewDate: string;
      totalReviews: number;
      correctCount: number;
      status: string;
      updatedAt?: string;
    }][];

    let synced = 0;
    let skipped = 0;

    // 批量预检：收集所有 wordId，一次查询确认哪些在数据库中存在
    const allWordIds = entries.map(([wordId]) => wordId);
    const existingWords = await prisma.word.findMany({
      where: { id: { in: allWordIds } },
      select: { id: true },
    });
    const validWordIds = new Set(existingWords.map((w) => w.id));

    for (const [wordId, data] of entries) {
      // 跳过数据库中不存在的 wordId（避免外键约束违反）
      if (!validWordIds.has(wordId)) {
        skipped++;
        continue;
      }

      const clientUpdatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

      // 查询现有记录，用于冲突检测
      const existing = await prisma.userWordProgress.findUnique({
        where: { userId_wordId: { userId, wordId } },
        select: { updatedAt: true },
      });

      // 冲突检测：只有客户端 updatedAt >= 服务端 updatedAt 时才更新
      if (existing && existing.updatedAt > clientUpdatedAt) {
        skipped++;
        continue;
      }

      await prisma.userWordProgress.upsert({
        where: {
          userId_wordId: { userId, wordId },
        },
        update: {
          repetitions: data.repetitions,
          easinessFactor: data.easinessFactor,
          interval: data.interval,
          nextReviewDate: new Date(data.nextReviewDate),
          totalReviews: data.totalReviews,
          correctCount: data.correctCount,
          status: data.status,
        },
        create: {
          userId,
          wordId,
          repetitions: data.repetitions,
          easinessFactor: data.easinessFactor,
          interval: data.interval,
          nextReviewDate: new Date(data.nextReviewDate),
          totalReviews: data.totalReviews,
          correctCount: data.correctCount,
          status: data.status,
        },
      });
      synced++;
    }

    return NextResponse.json({
      message: `成功同步 ${synced} 条学习记录${skipped > 0 ? `，跳过 ${skipped} 条（云端更新）` : ""}`,
      synced,
      skipped,
    });
  } catch (error) {
    console.error("同步进度失败:", error);
    return NextResponse.json(
      { error: "同步失败" },
      { status: 500 }
    );
  }
}
