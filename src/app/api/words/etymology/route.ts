/**
 * 词源 API
 * GET /api/words/etymology?word=xxx - 获取单词的词根词缀与词源
 * 先查缓存，未命中则调用外部 API 并缓存结果
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchEtymology } from "@/lib/dictionary-api";

export async function GET(request: NextRequest) {
  const word = new URL(request.url).searchParams.get("word");
  if (!word) {
    return NextResponse.json({ error: "缺少 word 参数" }, { status: 400 });
  }

  const wordKey = word.toLowerCase();

  try {
    // 查数据库缓存
    const cached = await prisma.wordEtymology.findUnique({
      where: { wordText: wordKey },
    });

    if (cached) {
      return NextResponse.json({
        word,
        origin: cached.origin,
        roots: cached.roots as { part: string; meaning: string }[],
        relatedWords: cached.relatedWords as string[],
      });
    }

    // 调用外部 API
    const data = await fetchEtymology(word);

    // 缓存到数据库
    await prisma.wordEtymology.upsert({
      where: { wordText: wordKey },
      create: {
        wordText: wordKey,
        roots: data.roots,
        origin: data.origin ?? null,
        relatedWords: data.relatedWords,
      },
      update: {
        roots: data.roots,
        origin: data.origin ?? null,
        relatedWords: data.relatedWords,
        fetchedAt: new Date(),
      },
    });

    return NextResponse.json({
      word,
      origin: data.origin,
      roots: data.roots,
      relatedWords: data.relatedWords,
    });
  } catch (error) {
    console.error("获取词源失败:", error);
    return NextResponse.json({ error: "获取词源失败" }, { status: 500 });
  }
}
