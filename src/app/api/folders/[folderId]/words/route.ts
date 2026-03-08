/**
 * 收藏夹单词管理 API
 * POST   /api/folders/:folderId/words - 添加单词到收藏夹
 * DELETE /api/folders/:folderId/words - 从收藏夹移除单词
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** POST: 添加单词到收藏夹 */
export async function POST(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    // 验证收藏夹归属
    const folder = await prisma.wordFolder.findFirst({
      where: { id: params.folderId, userId },
    });
    if (!folder) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    const { wordId } = await request.json();
    if (!wordId || typeof wordId !== "string") {
      return NextResponse.json({ error: "wordId 不能为空" }, { status: 400 });
    }

    // 验证单词存在
    const word = await prisma.word.findUnique({ where: { id: wordId } });
    if (!word) {
      return NextResponse.json({ error: "单词不存在" }, { status: 404 });
    }

    const folderWord = await prisma.folderWord.upsert({
      where: {
        folderId_wordId: { folderId: params.folderId, wordId },
      },
      update: {},
      create: { folderId: params.folderId, wordId },
    });

    return NextResponse.json({
      id: folderWord.id,
      folderId: folderWord.folderId,
      wordId: folderWord.wordId,
      addedAt: folderWord.addedAt.toISOString(),
    });
  } catch (error) {
    console.error("添加单词到收藏夹失败:", error);
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }
}

/** DELETE: 从收藏夹移除单词 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const folder = await prisma.wordFolder.findFirst({
      where: { id: params.folderId, userId },
    });
    if (!folder) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    const { wordId } = await request.json();
    if (!wordId || typeof wordId !== "string") {
      return NextResponse.json({ error: "wordId 不能为空" }, { status: 400 });
    }

    await prisma.folderWord.deleteMany({
      where: { folderId: params.folderId, wordId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("移除单词失败:", error);
    return NextResponse.json({ error: "移除失败" }, { status: 500 });
  }
}
