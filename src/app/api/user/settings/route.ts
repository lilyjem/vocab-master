/**
 * 用户设置 API
 * GET  /api/user/settings - 获取用户设置
 * PUT  /api/user/settings - 更新用户设置
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** 默认设置值 */
const DEFAULT_SETTINGS = {
  dailyNewWords: 20,
  dailyReviewWords: 50,
  autoPlayAudio: true,
  showPhonetic: true,
  pronunciation: "en-US",
  theme: "system",
};

/** GET: 获取用户设置，不存在则返回默认值 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // 用户尚未保存过设置，返回默认值
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    return NextResponse.json({
      dailyNewWords: settings.dailyNewWords,
      dailyReviewWords: settings.dailyReviewWords,
      autoPlayAudio: settings.autoPlayAudio,
      showPhonetic: settings.showPhonetic,
      pronunciation: settings.pronunciation,
      theme: settings.theme,
    });
  } catch (error) {
    console.error("获取用户设置失败:", error);
    return NextResponse.json({ error: "获取设置失败" }, { status: 500 });
  }
}

/** PUT: 更新用户设置（支持部分更新） */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await request.json();

    // 只允许更新已知的设置字段
    const allowedFields = [
      "dailyNewWords", "dailyReviewWords", "autoPlayAudio",
      "showPhonetic", "pronunciation", "theme",
    ];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "没有有效的设置字段" }, { status: 400 });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...DEFAULT_SETTINGS,
        ...updateData,
      },
    });

    return NextResponse.json({
      dailyNewWords: settings.dailyNewWords,
      dailyReviewWords: settings.dailyReviewWords,
      autoPlayAudio: settings.autoPlayAudio,
      showPhonetic: settings.showPhonetic,
      pronunciation: settings.pronunciation,
      theme: settings.theme,
    });
  } catch (error) {
    console.error("更新用户设置失败:", error);
    return NextResponse.json({ error: "更新设置失败" }, { status: 500 });
  }
}
