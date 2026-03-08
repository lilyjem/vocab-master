/**
 * 单个收藏夹 API
 * GET    /api/folders/:folderId - 获取收藏夹详情（含单词列表）
 * PUT    /api/folders/:folderId - 更新收藏夹（名称、颜色）
 * DELETE /api/folders/:folderId - 删除收藏夹
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** 验证收藏夹归属 */
async function verifyOwnership(folderId: string, userId: string) {
  return prisma.wordFolder.findFirst({
    where: { id: folderId, userId },
  });
}

/** GET: 获取收藏夹详情（含单词列表） */
export async function GET(
  _request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const folder = await verifyOwnership(params.folderId, userId);
    if (!folder) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    const folderWords = await prisma.folderWord.findMany({
      where: { folderId: params.folderId },
      orderBy: { addedAt: "desc" },
      include: { word: true },
    });

    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      words: folderWords.map((fw) => ({
        ...fw.word,
        addedAt: fw.addedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("获取收藏夹详情失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/** PUT: 更新收藏夹 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const folder = await verifyOwnership(params.folderId, userId);
    if (!folder) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    const { name, color } = await request.json();
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
      }
      if (name.trim().length > 20) {
        return NextResponse.json({ error: "名称不能超过 20 个字符" }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (color !== undefined) {
      updateData.color = color;
    }

    const updated = await prisma.wordFolder.update({
      where: { id: params.folderId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      color: updated.color,
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "已存在同名收藏夹" }, { status: 409 });
    }
    console.error("更新收藏夹失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

/** DELETE: 删除收藏夹 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const folder = await verifyOwnership(params.folderId, userId);
    if (!folder) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    await prisma.wordFolder.delete({ where: { id: params.folderId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除收藏夹失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
