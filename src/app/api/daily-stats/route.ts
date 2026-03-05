/**
 * 每日学习统计同步 API
 * GET  /api/daily-stats - 拉取云端每日统计（返回 Record<date, stats>）
 * POST /api/daily-stats - 推送本地每日统计到云端（支持批量和单日）
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET: 返回 { [date]: { wordsLearned, wordsReviewed, studyMinutes } } */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const rows = await prisma.dailyCheckIn.findMany({
      where: { userId },
      orderBy: { checkInDate: "desc" },
      take: 365, // 最多拉取一年的数据
    });

    const result: Record<string, {
      date: string;
      wordsLearned: number;
      wordsReviewed: number;
      studyMinutes: number;
    }> = {};

    for (const row of rows) {
      // 数据库中 checkInDate 是 Date 类型，转为 YYYY-MM-DD 字符串
      const dateKey = row.checkInDate.toISOString().split("T")[0];
      result[dateKey] = {
        date: dateKey,
        wordsLearned: row.wordsLearned,
        wordsReviewed: row.wordsReviewed,
        studyMinutes: row.studyMinutes,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("获取每日统计失败:", error);
    return NextResponse.json({ error: "获取每日统计失败" }, { status: 500 });
  }
}

/** POST: 接收 { dailyStats: { [date]: { wordsLearned, wordsReviewed, studyMinutes } } } */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { dailyStats } = await request.json();

    if (!dailyStats || typeof dailyStats !== "object") {
      return NextResponse.json({ error: "无效的统计数据" }, { status: 400 });
    }

    const entries = Object.entries(dailyStats) as [string, {
      date: string;
      wordsLearned: number;
      wordsReviewed: number;
      studyMinutes: number;
    }][];

    let synced = 0;

    for (const [dateKey, data] of entries) {
      // 跳过无效数据
      if (!data.wordsLearned && !data.wordsReviewed) continue;

      const checkInDate = new Date(dateKey + "T00:00:00.000Z");

      // 查询现有记录
      const existing = await prisma.dailyCheckIn.findUnique({
        where: { userId_checkInDate: { userId, checkInDate } },
      });

      if (existing) {
        // 云端已有数据 → 取两者中的较大值（累积合并）
        await prisma.dailyCheckIn.update({
          where: { userId_checkInDate: { userId, checkInDate } },
          data: {
            wordsLearned: Math.max(existing.wordsLearned, data.wordsLearned || 0),
            wordsReviewed: Math.max(existing.wordsReviewed, data.wordsReviewed || 0),
            studyMinutes: Math.max(existing.studyMinutes, data.studyMinutes || 0),
          },
        });
      } else {
        // 云端没有 → 创建新记录
        await prisma.dailyCheckIn.create({
          data: {
            userId,
            checkInDate,
            wordsLearned: data.wordsLearned || 0,
            wordsReviewed: data.wordsReviewed || 0,
            studyMinutes: data.studyMinutes || 0,
            streak: 1,
          },
        });
      }
      synced++;
    }

    return NextResponse.json({ message: `同步 ${synced} 天的学习统计`, synced });
  } catch (error) {
    console.error("同步每日统计失败:", error);
    return NextResponse.json({ error: "同步失败" }, { status: 500 });
  }
}
