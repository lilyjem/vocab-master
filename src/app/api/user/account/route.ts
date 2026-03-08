/**
 * 账户管理 API
 * DELETE /api/user/account - 注销账户（删除用户及所有关联数据）
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "请输入密码确认" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "该账户不支持此操作" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "密码错误" }, { status: 400 });
    }

    // Prisma schema 已配置 onDelete: Cascade，删除用户会级联删除所有关联数据
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: "账户已注销" });
  } catch (error) {
    console.error("注销账户失败:", error);
    return NextResponse.json({ error: "注销账户失败" }, { status: 500 });
  }
}
