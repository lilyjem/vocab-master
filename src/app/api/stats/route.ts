/**
 * 学习统计 API
 * GET /api/stats - 获取登录用户的学习统计
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // 获取学习进度统计
    const progressStats = await prisma.userWordProgress.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    });

    // 获取总正确率
    const accuracyData = await prisma.userWordProgress.aggregate({
      where: { userId },
      _sum: {
        totalReviews: true,
        correctCount: true,
      },
    });

    // 获取近30天打卡记录
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const checkIns = await prisma.dailyCheckIn.findMany({
      where: {
        userId,
        checkInDate: { gte: thirtyDaysAgo },
      },
      orderBy: { checkInDate: "asc" },
    });

    // 获取当前连续打卡天数
    const latestCheckIn = await prisma.dailyCheckIn.findFirst({
      where: { userId },
      orderBy: { checkInDate: "desc" },
    });

    return NextResponse.json({
      progressStats,
      accuracy: {
        totalReviews: accuracyData._sum.totalReviews || 0,
        correctCount: accuracyData._sum.correctCount || 0,
      },
      checkIns,
      streak: latestCheckIn?.streak || 0,
    });
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return NextResponse.json(
      { error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
