/**
 * 个人资料 API
 * GET  /api/user/profile - 获取个人资料
 * PUT  /api/user/profile - 更新个人资料（昵称等）
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("获取个人资料失败:", error);
    return NextResponse.json({ error: "获取个人资料失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await request.json();

    if (body.name !== undefined && body.name !== null && typeof body.name !== "string") {
      return NextResponse.json({ error: "name 必须为字符串或 null" }, { status: 400 });
    }
    if (typeof body.name === "string" && body.name.length > 50) {
      return NextResponse.json({ error: "昵称不能超过 50 个字符" }, { status: 400 });
    }
    if (body.name !== undefined && body.name !== null && typeof body.name === "string" && body.name.trim().length === 0) {
      return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
    }

    const name = body.name?.trim();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: name?.trim() },
      select: { id: true, name: true, email: true, image: true, emailVerified: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("更新个人资料失败:", error);
    return NextResponse.json({ error: "更新个人资料失败" }, { status: 500 });
  }
}
