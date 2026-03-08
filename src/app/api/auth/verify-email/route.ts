/**
 * 邮箱验证 API
 * GET  /api/auth/verify-email?token=xxx - 验证邮箱（注册验证）
 * GET  /api/auth/verify-email?token=xxx&type=change-email - 确认邮箱变更
 * POST /api/auth/verify-email - 重新发送验证邮件
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

/** GET: 处理验证链接点击 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const type = searchParams.get("type");

  if (!token) {
    return NextResponse.json({ error: "缺少验证令牌" }, { status: 400 });
  }

  try {
    if (type === "change-email") {
      // 邮箱变更验证
      const record = await prisma.verificationToken.findFirst({
        where: {
          token,
          identifier: { startsWith: "change-email:" },
          expires: { gt: new Date() },
        },
      });

      if (!record) {
        return NextResponse.json({ error: "链接已过期或无效" }, { status: 400 });
      }

      // 解析 identifier: change-email:userId:newEmail
      const parts = record.identifier.split(":");
      const userId = parts[1];
      const newEmail = parts.slice(2).join(":");

      // 再次检查新邮箱是否被占用
      const existing = await prisma.user.findUnique({
        where: { email: newEmail },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: "该邮箱已被其他账户使用" }, { status: 400 });
      }

      // 更新邮箱
      await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail, emailVerified: new Date() },
      });

      // 删除 token
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: record.identifier, token } },
      });

      return NextResponse.json({ message: "邮箱已更新", type: "change-email" });
    } else {
      // 注册邮箱验证
      const record = await prisma.verificationToken.findFirst({
        where: {
          token,
          identifier: { startsWith: "verify:" },
          expires: { gt: new Date() },
        },
      });

      if (!record) {
        return NextResponse.json({ error: "链接已过期或无效" }, { status: 400 });
      }

      const userId = record.identifier.replace("verify:", "");

      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });

      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: record.identifier, token } },
      });

      return NextResponse.json({ message: "邮箱验证成功", type: "verify" });
    }
  } catch (error) {
    console.error("邮箱验证失败:", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}

/** POST: 重新发送验证邮件 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "用户信息异常" }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "邮箱已验证" }, { status: 400 });
    }

    // 删除旧 token
    await prisma.verificationToken.deleteMany({
      where: { identifier: `verify:${userId}` },
    });

    // 生成新 token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 小时有效

    await prisma.verificationToken.create({
      data: {
        identifier: `verify:${userId}`,
        token,
        expires,
      },
    });

    await sendVerificationEmail(user.email, token);

    return NextResponse.json({ message: "验证邮件已发送" });
  } catch (error) {
    console.error("发送验证邮件失败:", error);
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}
