/**
 * 当前词库 API
 * GET  /api/user/current-book - 获取用户当前选择的词库
 * PUT  /api/user/current-book - 更新用户当前选择的词库
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET: 获取当前选择的词库 ID */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentBookId: true },
    });

    return NextResponse.json({
      currentBookId: user?.currentBookId ?? null,
    });
  } catch (error) {
    console.error("获取当前词库失败:", error);
    return NextResponse.json({ error: "获取当前词库失败" }, { status: 500 });
  }
}

/** PUT: 更新当前选择的词库 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { bookId } = await request.json();

    if (bookId !== null && typeof bookId !== "string") {
      return NextResponse.json({ error: "无效的词库 ID" }, { status: 400 });
    }

    // 如果 bookId 不为 null，验证词库是否存在
    if (bookId) {
      const book = await prisma.wordBook.findUnique({
        where: { id: bookId },
        select: { id: true },
      });
      if (!book) {
        return NextResponse.json({ error: "词库不存在" }, { status: 404 });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { currentBookId: bookId },
      select: { currentBookId: true },
    });

    return NextResponse.json({
      currentBookId: user.currentBookId,
    });
  } catch (error) {
    console.error("更新当前词库失败:", error);
    return NextResponse.json({ error: "更新当前词库失败" }, { status: 500 });
  }
}
