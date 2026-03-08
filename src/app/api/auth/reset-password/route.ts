/**
 * 密码重置 API
 * POST /api/auth/reset-password - 使用 token 重置密码
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "密码至少 6 个字符" }, { status: 400 });
    }

    // 查找 token
    const record = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: "reset:" },
        expires: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "链接已过期或无效，请重新申请" }, { status: 400 });
    }

    // 从 identifier 中提取 userId
    const userId = record.identifier.replace("reset:", "");

    // 更新密码
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // 删除已使用的 token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token } },
    });

    return NextResponse.json({ message: "密码重置成功，请使用新密码登录" });
  } catch (error) {
    console.error("密码重置失败:", error);
    return NextResponse.json({ error: "密码重置失败" }, { status: 500 });
  }
}
