/**
 * 用户注册 API
 * POST /api/auth/register
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { validateRegistration, extractNameFromEmail } from "@/lib/validation";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // 参数验证
    const validation = validateRegistration({ email, password, name });
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name || extractNameFromEmail(email),
        email,
        passwordHash,
      },
    });

    // 发送邮箱验证邮件
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 小时

      await prisma.verificationToken.create({
        data: {
          identifier: `verify:${user.id}`,
          token,
          expires,
        },
      });

      await sendVerificationEmail(email, token);
    } catch (e) {
      console.error("发送验证邮件失败:", e);
      // 不影响注册流程
    }

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        message: "注册成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
