/**
 * 密码修改 API
 * PUT /api/user/password - 修改当前用户密码
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "新密码至少 6 个字符" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "该账户不支持密码修改" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ message: "密码修改成功" });
  } catch (error) {
    console.error("密码修改失败:", error);
    return NextResponse.json({ error: "密码修改失败" }, { status: 500 });
  }
}
