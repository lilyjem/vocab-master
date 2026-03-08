/**
 * 收藏夹 API
 * GET  /api/folders - 获取用户所有收藏夹（含单词数量）
 * POST /api/folders - 创建新收藏夹
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET: 获取用户所有收藏夹 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const folders = await prisma.wordFolder.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { words: true } },
      },
    });

    return NextResponse.json(
      folders.map((f) => ({
        id: f.id,
        name: f.name,
        color: f.color,
        sortOrder: f.sortOrder,
        wordCount: f._count.words,
        createdAt: f.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("获取收藏夹失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/** POST: 创建新收藏夹 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const { name, color } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "收藏夹名称不能为空" }, { status: 400 });
    }
    if (name.trim().length > 20) {
      return NextResponse.json({ error: "收藏夹名称不能超过 20 个字符" }, { status: 400 });
    }

    // 获取当前最大排序值
    const maxOrder = await prisma.wordFolder.findFirst({
      where: { userId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const folder = await prisma.wordFolder.create({
      data: {
        userId,
        name: name.trim(),
        color: color || "#3b82f6",
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      sortOrder: folder.sortOrder,
      wordCount: 0,
      createdAt: folder.createdAt.toISOString(),
    });
  } catch (error: unknown) {
    // 唯一约束冲突（同名收藏夹）
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "已存在同名收藏夹" }, { status: 409 });
    }
    console.error("创建收藏夹失败:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
