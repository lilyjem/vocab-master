/**
 * 成就 API
 * GET  /api/achievements - 获取当前用户的所有成就进度
 * POST /api/achievements - 触发成就检查，更新 DB，返回新解锁的成就
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  checkAchievements,
  findNewUnlocks,
  type AchievementStats,
  type AchievementResult,
} from "@/lib/achievements";

/** 从数据库聚合用户统计数据 */
async function getAchievementStats(userId: string): Promise<AchievementStats> {
  // 累计学习单词数（有过学习记录的单词数）
  const wordProgressCount = await prisma.userWordProgress.count({
    where: { userId },
  });

  // 累计复习次数
  const reviewAgg = await prisma.userWordProgress.aggregate({
    where: { userId },
    _sum: { totalReviews: true },
  });
  const totalReviews = reviewAgg._sum.totalReviews ?? 0;

  // 当前连续打卡天数（取最新打卡记录的 streak）
  const latestCheckIn = await prisma.dailyCheckIn.findFirst({
    where: { userId },
    orderBy: { checkInDate: "desc" },
  });
  const currentStreak = latestCheckIn?.streak ?? 0;

  // 累计学习分钟数
  const studyAgg = await prisma.dailyCheckIn.aggregate({
    where: { userId },
    _sum: { studyMinutes: true },
  });
  const totalStudyMinutes = studyAgg._sum.studyMinutes ?? 0;

  // 学习会话：最佳正确率、拼写正确数、早起次数
  const sessions = await prisma.learningSession.findMany({
    where: { userId },
    select: {
      correctCount: true,
      totalCount: true,
      mode: true,
      startTime: true,
    },
  });

  let bestAccuracy = 0;
  let totalSpellCorrect = 0;
  let earlyBirdCount = 0;
  let nightOwlCount = 0;
  let weekendWarriorCount = 0;

  for (const s of sessions) {
    if (s.totalCount > 0) {
      const acc = Math.round((s.correctCount / s.totalCount) * 100);
      if (acc > bestAccuracy) bestAccuracy = acc;
    }
    if (s.mode === "spell") {
      totalSpellCorrect += s.correctCount;
    }
    const d = new Date(s.startTime);
    const hour = d.getHours();
    if (hour >= 6 && hour < 8) earlyBirdCount++;
    if (hour >= 22 && hour < 24) nightOwlCount++;
    const day = d.getDay();
    if (day === 0 || day === 6) weekendWarriorCount++;
  }

  // 完成词书数：词书中所有单词都已掌握的书籍数
  const books = await prisma.wordBook.findMany({
    select: { id: true, wordCount: true },
    where: { wordCount: { gt: 0 } },
  });
  let booksCompleted = 0;
  for (const book of books) {
    const masteredCount = await prisma.userWordProgress.count({
      where: {
        userId,
        status: "mastered",
        word: { bookId: book.id },
      },
    });
    if (masteredCount >= book.wordCount) booksCompleted++;
  }

  // 里程碑统计：单日学 100 词 / 单日学 120 分钟的天数
  const dailyCheckIns = await prisma.dailyCheckIn.findMany({
    where: { userId },
    select: { wordsLearned: true, wordsReviewed: true, studyMinutes: true },
  });
  let wordSlayerDays = 0;
  let marathonDays = 0;
  for (const ci of dailyCheckIns) {
    if ((ci.wordsLearned + ci.wordsReviewed) >= 100) wordSlayerDays++;
    if (ci.studyMinutes >= 120) marathonDays++;
  }

  return {
    totalWordsLearned: wordProgressCount,
    currentStreak,
    totalReviews,
    bestAccuracy,
    totalSpellCorrect,
    booksCompleted,
    totalStudyMinutes,
    earlyBirdCount,
    nightOwlCount,
    weekendWarriorCount,
    wordSlayerDays,
    marathonDays,
  };
}

/** 将 UserAchievement 转为 AchievementResult 用于 findNewUnlocks */
function toAchievementResult(
  ua: { achievement: { code: string; name: string }; tier: string; progress: number }
): AchievementResult {
  return {
    code: ua.achievement.code,
    name: ua.achievement.name,
    tier: ua.tier as AchievementResult["tier"],
    progress: ua.progress,
    maxForCurrentTier: 0,
  };
}

/** GET: 获取当前用户成就进度 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const stats = await getAchievementStats(userId);
    const results = checkAchievements(stats);
    return NextResponse.json(results);
  } catch (error) {
    console.error("获取成就失败:", error);
    return NextResponse.json(
      { error: "获取成就失败" },
      { status: 500 }
    );
  }
}

/** POST: 触发成就检查，更新 DB，返回新解锁的成就 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const stats = await getAchievementStats(userId);
    const newResults = checkAchievements(stats);

    // 获取当前 DB 中的成就记录作为“旧状态”
    const achievements = await prisma.achievement.findMany({
      select: { id: true, code: true },
    });
    const codeToId = Object.fromEntries(achievements.map((a) => [a.code, a.id]));

    const oldUserAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: { select: { code: true, name: true } } },
    });
    const oldResults = oldUserAchievements.map(toAchievementResult);

    const newUnlocks = findNewUnlocks(oldResults, newResults);

    // 更新 DB：upsert 每个成就的进度
    const now = new Date();
    for (const r of newResults) {
      const achievementId = codeToId[r.code];
      if (!achievementId) continue;

      const existing = oldUserAchievements.find(
        (ua) => ua.achievement.code === r.code
      );
      const isNewlyUnlocked = newUnlocks.some((u) => u.code === r.code);
      const unlockedAt =
        isNewlyUnlocked || (existing && r.tier !== "none")
          ? now
          : existing?.unlockedAt ?? null;

      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: { userId, achievementId },
        },
        update: {
          tier: r.tier,
          progress: r.progress,
          unlockedAt: isNewlyUnlocked ? now : undefined,
        },
        create: {
          userId,
          achievementId,
          tier: r.tier,
          progress: r.progress,
          unlockedAt: r.tier !== "none" ? now : null,
        },
      });
    }

    return NextResponse.json({
      achievements: newResults,
      newUnlocks,
    });
  } catch (error) {
    console.error("成就检查失败:", error);
    return NextResponse.json(
      { error: "成就检查失败" },
      { status: 500 }
    );
  }
}
