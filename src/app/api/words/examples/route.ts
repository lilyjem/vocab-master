/**
 * 例句 API
 * GET /api/words/examples?word=xxx - 获取单词的例句
 * 先查缓存，未命中则调用外部 API 并缓存结果
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchExamples } from "@/lib/dictionary-api";

export async function GET(request: NextRequest) {
  const word = new URL(request.url).searchParams.get("word");
  if (!word) {
    return NextResponse.json({ error: "缺少 word 参数" }, { status: 400 });
  }

  try {
    // 查数据库缓存
    const cached = await prisma.wordExample.findMany({
      where: { wordText: word.toLowerCase() },
      orderBy: { fetchedAt: "desc" },
      take: 5,
    });

    // 缓存命中且至少有一条带翻译的记录，直接返回
    const hasTranslation = cached.some((c) => c.translation);
    if (cached.length > 0 && hasTranslation) {
      return NextResponse.json({
        word,
        examples: cached.map((c) => ({
          sentence: c.sentence,
          translation: c.translation,
        })),
      });
    }

    // 缓存存在但无翻译（旧数据），删除后重新获取
    if (cached.length > 0 && !hasTranslation) {
      await prisma.wordExample.deleteMany({
        where: { wordText: word.toLowerCase() },
      });
    }

    // 调用外部 API
    const examples = await fetchExamples(word);

    // 缓存到数据库
    if (examples.length > 0) {
      await prisma.wordExample.createMany({
        data: examples.map((e) => ({
          wordText: word.toLowerCase(),
          sentence: e.sentence,
          translation: e.translation || null,
        })),
      });
    }

    return NextResponse.json({ word, examples });
  } catch (error) {
    console.error("获取例句失败:", error);
    return NextResponse.json({ error: "获取例句失败" }, { status: 500 });
  }
}
