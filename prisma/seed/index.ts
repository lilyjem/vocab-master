/**
 * 数据库种子脚本 - 导入所有词库数据
 *
 * 支持两种数据格式：
 * 1. 子目录格式（优先）: cet4/meta.json + cet4/words-001.json, words-002.json, ...
 * 2. 单文件格式（兼容）: cet4.json（包含 book + words）
 *
 * 运行: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { ACHIEVEMENTS } from "./achievements";
import { getWordFrequency } from "./frequency-data";

const prisma = new PrismaClient();

/** 词库目录/文件名列表 */
const BOOK_IDS = ["cet4", "cet6", "postgrad", "ielts", "toefl", "gre"];

interface WordData {
  word: string;
  phonetic?: string;
  definition: string;
  partOfSpeech?: string;
  example?: string;
  exampleTranslation?: string;
  difficulty: number;
}

interface BookMeta {
  name: string;
  description: string;
  level: string;
  category: string;
  coverColor: string;
  sortOrder: number;
  wordCount?: number;
}

interface LegacySeedData {
  book: BookMeta;
  words: WordData[];
}

/**
 * 从子目录加载词库数据
 * 读取 meta.json 获取词库信息，读取 words-*.json 获取所有单词
 */
function loadFromDirectory(dirPath: string): { meta: BookMeta; words: WordData[] } | null {
  const metaPath = path.join(dirPath, "meta.json");
  if (!fs.existsSync(metaPath)) return null;

  const meta: BookMeta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

  // 按文件名排序读取所有 words-*.json
  const wordFiles = fs
    .readdirSync(dirPath)
    .filter((f) => f.startsWith("words-") && f.endsWith(".json"))
    .sort();

  const words: WordData[] = [];
  for (const file of wordFiles) {
    try {
      const batch: WordData[] = JSON.parse(
        fs.readFileSync(path.join(dirPath, file), "utf-8")
      );
      words.push(...batch);
    } catch (err) {
      console.warn(`  ⚠ 读取失败: ${file} - ${err}`);
    }
  }

  return { meta, words };
}

/**
 * 从单文件加载词库数据（旧格式兼容）
 */
function loadFromSingleFile(filePath: string): { meta: BookMeta; words: WordData[] } | null {
  if (!fs.existsSync(filePath)) return null;

  const data: LegacySeedData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return { meta: data.book, words: data.words };
}

/**
 * 批量导入单词到数据库
 * Prisma createMany 有参数限制，需要分批插入
 */
async function batchCreateWords(bookId: string, words: WordData[]): Promise<void> {
  const CHUNK_SIZE = 500;
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE);
    await prisma.word.createMany({
      data: chunk.map((w) => ({
        bookId,
        word: w.word,
        phonetic: w.phonetic || null,
        definition: w.definition,
        partOfSpeech: w.partOfSpeech || null,
        example: w.example || null,
        exampleTranslation: w.exampleTranslation || null,
        difficulty: w.difficulty,
        frequency: getWordFrequency(w.word), // 基于 COCA 词频表匹配词频
      })),
    });
  }
}

async function main() {
  console.log("🚀 开始导入词库数据...\n");

  let totalWords = 0;

  for (const bookId of BOOK_IDS) {
    const dirPath = path.join(__dirname, bookId);
    const filePath = path.join(__dirname, `${bookId}.json`);

    // 优先从子目录加载（新格式），否则从单文件加载（旧格式）
    let data = loadFromDirectory(dirPath);
    let source = "子目录";

    if (!data) {
      data = loadFromSingleFile(filePath);
      source = "单文件";
    }

    if (!data) {
      console.warn(`⚠ 未找到词库数据: ${bookId}，跳过`);
      continue;
    }

    console.log(`📚 ${data.meta.name}（${source}，${data.words.length} 个单词）`);

    // 创建或更新词库
    const book = await prisma.wordBook.upsert({
      where: { name: data.meta.name },
      update: {
        description: data.meta.description,
        level: data.meta.level,
        category: data.meta.category,
        coverColor: data.meta.coverColor,
        sortOrder: data.meta.sortOrder,
        wordCount: data.words.length,
      },
      create: {
        name: data.meta.name,
        description: data.meta.description,
        level: data.meta.level,
        category: data.meta.category,
        coverColor: data.meta.coverColor,
        sortOrder: data.meta.sortOrder,
        wordCount: data.words.length,
      },
    });

    // 先删除该词库旧数据，再批量插入新数据
    await prisma.word.deleteMany({ where: { bookId: book.id } });
    await batchCreateWords(book.id, data.words);

    totalWords += data.words.length;
    console.log(`   ✓ 完成\n`);
  }

  // 导入成就定义
  console.log("🏆 导入成就定义...");
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        bronzeThreshold: achievement.bronzeThreshold,
        silverThreshold: achievement.silverThreshold,
        goldThreshold: achievement.goldThreshold,
        platinumThreshold: achievement.platinumThreshold,
        diamondThreshold: achievement.diamondThreshold,
        starThreshold: achievement.starThreshold,
        kingThreshold: achievement.kingThreshold,
      },
      create: achievement,
    });
  }
  console.log(`   ✓ ${ACHIEVEMENTS.length} 个成就定义已导入\n`);

  console.log(`🎉 全部词库导入完成！共 ${totalWords} 个单词`);
}

main()
  .catch((e) => {
    console.error("导入失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
