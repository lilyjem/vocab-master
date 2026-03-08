/**
 * 忘记密码 API
 * POST /api/auth/forgot-password - 发送密码重置邮件
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "请输入邮箱" }, { status: 400 });
    }

    // 无论邮箱是否存在都返回相同消息（防止邮箱枚举）
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (user?.passwordHash) {
      // 生成重置 token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 小时有效

      // 删除该用户之前的重置 token
      await prisma.verificationToken.deleteMany({
        where: { identifier: `reset:${user.id}` },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: `reset:${user.id}`,
          token,
          expires,
        },
      });

      // 发送重置邮件
      try {
        await sendPasswordResetEmail(email, token);
      } catch (e) {
        console.error("发送重置邮件失败:", e);
      }
    }

    // 统一返回消息
    return NextResponse.json({
      message: "如果该邮箱已注册，您将收到密码重置邮件",
    });
  } catch (error) {
    console.error("忘记密码处理失败:", error);
    return NextResponse.json({ error: "处理失败" }, { status: 500 });
  }
}
