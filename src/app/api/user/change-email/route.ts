/**
 * 修改邮箱 API
 * POST /api/user/change-email - 发起邮箱变更（发送验证邮件到新邮箱）
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmailChangeVerification } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { password, newEmail } = await request.json();

    if (!password || !newEmail) {
      return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    // 验证密码
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "该账户不支持此操作" }, { status: 400 });
    }

    if (user.email === newEmail) {
      return NextResponse.json({ error: "新邮箱与当前邮箱相同" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "密码错误" }, { status: 400 });
    }

    // 检查新邮箱是否已被使用
    const existing = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已被其他账户使用" }, { status: 400 });
    }

    // 生成验证 token（identifier 存储格式: change-email:userId:newEmail）
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 小时有效

    await prisma.verificationToken.create({
      data: {
        identifier: `change-email:${userId}:${newEmail}`,
        token,
        expires,
      },
    });

    // 发送验证邮件到新邮箱
    await sendEmailChangeVerification(newEmail, token);

    return NextResponse.json({ message: "验证邮件已发送到新邮箱，请查收" });
  } catch (error) {
    console.error("修改邮箱失败:", error);
    return NextResponse.json({ error: "修改邮箱失败" }, { status: 500 });
  }
}
