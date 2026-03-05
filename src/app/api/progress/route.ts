/**
 * 学习进度同步 API
 * GET  /api/progress - 获取用户的学习进度
 * POST /api/progress - 同步本地学习进度到云端
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const progress = await prisma.userWordProgress.findMany({
      where: { userId },
      include: { word: true },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("获取进度失败:", error);
    return NextResponse.json(
      { error: "获取进度失败" },
      { status: 500 }
    );
  }
}

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

    // 批量同步进度数据
    const entries = Object.entries(wordProgress) as [string, {
      wordId: string;
      repetitions: number;
      easinessFactor: number;
      interval: number;
      nextReviewDate: string;
      totalReviews: number;
      correctCount: number;
      status: string;
    }][];

    let synced = 0;

    for (const [wordId, data] of entries) {
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
      message: `成功同步 ${synced} 条学习记录`,
      synced,
    });
  } catch (error) {
    console.error("同步进度失败:", error);
    return NextResponse.json(
      { error: "同步失败" },
      { status: 500 }
    );
  }
}
