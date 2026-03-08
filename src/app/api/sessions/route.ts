/**
 * 学习会话 API
 * GET  /api/sessions - 获取用户最近的学习会话
 * POST /api/sessions - 创建新的学习会话记录
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET: 获取最近 100 条学习会话 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const sessions = await prisma.learningSession.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      take: 100,
    });

    // 转换为前端格式
    const result = sessions.map((s) => ({
      id: s.id,
      mode: s.mode,
      bookId: s.bookId,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString() ?? null,
      newWordsCount: s.newWordsCount,
      reviewWordsCount: s.reviewWordsCount,
      correctCount: s.correctCount,
      totalCount: s.totalCount,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("获取学习会话失败:", error);
    return NextResponse.json({ error: "获取学习会话失败" }, { status: 500 });
  }
}

/** POST: 创建新的学习会话 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await request.json();

    // 验证必要字段
    if (!body.mode || !["learn", "review", "spell", "quiz"].includes(body.mode)) {
      return NextResponse.json({ error: "无效的学习模式" }, { status: 400 });
    }

    const created = await prisma.learningSession.create({
      data: {
        userId,
        bookId: body.bookId || null,
        mode: body.mode,
        startTime: body.startTime ? new Date(body.startTime) : new Date(),
        endTime: body.endTime ? new Date(body.endTime) : null,
        newWordsCount: body.newWordsCount || 0,
        reviewWordsCount: body.reviewWordsCount || 0,
        correctCount: body.correctCount || 0,
        totalCount: body.totalCount || 0,
      },
    });

    return NextResponse.json({
      id: created.id,
      mode: created.mode,
      bookId: created.bookId,
      startTime: created.startTime.toISOString(),
      endTime: created.endTime?.toISOString() ?? null,
      newWordsCount: created.newWordsCount,
      reviewWordsCount: created.reviewWordsCount,
      correctCount: created.correctCount,
      totalCount: created.totalCount,
    });
  } catch (error) {
    console.error("创建学习会话失败:", error);
    return NextResponse.json({ error: "创建学习会话失败" }, { status: 500 });
  }
}
