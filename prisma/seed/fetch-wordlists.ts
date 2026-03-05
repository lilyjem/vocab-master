/**
 * 词库数据下载与解析脚本（改进版）
 *
 * 直接从 GitHub 开源词汇表项目下载带释义的词表文件，
 * 解析出 单词、音标、词性、中文释义，生成标准 JSON 词库文件。
 *
 * 数据源：
 * - CET4/CET6/TOEFL/GRE/考研: mahavivo/english-wordlists（格式: 单词 [音标] 释义）
 * - IELTS: jimuyouyou/all-ielts-words + 百度翻译 API（纯单词列表，需翻译）
 *
 * 运行: npx tsx prisma/seed/fetch-wordlists.ts
 */
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ===== 环境变量加载 =====
const envPath = path.join(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

const BAIDU_APPID = process.env.BAIDU_TRANSLATE_APPID || "";
const BAIDU_KEY = process.env.BAIDU_TRANSLATE_KEY || "";

const SEED_DIR = __dirname;
const BATCH_SIZE = 200;
const BAIDU_DELAY_MS = 150;

// ===== 类型定义 =====
interface WordEntry {
  word: string;
  phonetic: string;
  definition: string;
  partOfSpeech: string;
  example: string;
  exampleTranslation: string;
  difficulty: number;
}

// ===== 工具函数 =====
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateDifficulty(word: string): number {
  const len = word.length;
  if (len <= 4) return 1;
  if (len <= 6) return 2;
  if (len <= 8) return 3;
  if (len <= 11) return 4;
  return 5;
}

/** 百度翻译签名 */
function baiduSign(q: string, salt: string): string {
  return crypto.createHash("md5").update(BAIDU_APPID + q + salt + BAIDU_KEY).digest("hex");
}

/** 批量百度翻译（支持换行符分隔的多个词） */
async function baiduTranslateBatch(texts: string[], from = "en", to = "zh"): Promise<string[]> {
  const q = texts.join("\n");
  const salt = Date.now().toString();
  const sign = baiduSign(q, salt);

  const params = new URLSearchParams({
    q,
    from,
    to,
    appid: BAIDU_APPID,
    salt,
    sign,
  });

  try {
    const resp = await fetch("https://fanyi-api.baidu.com/api/trans/vip/translate", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await resp.json();
    if (data.trans_result && data.trans_result.length > 0) {
      return data.trans_result.map((r: { dst: string }) => r.dst);
    }
    if (data.error_code) {
      console.warn(`  ⚠ 百度翻译错误 [${data.error_code}]: ${data.error_msg}`);
    }
    return texts.map(() => "");
  } catch (err) {
    console.warn(`  ⚠ 百度翻译请求失败: ${err}`);
    return texts.map(() => "");
  }
}

/** 从 URL 获取文本 */
async function fetchText(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);
  return resp.text();
}

/**
 * 解析 mahavivo 格式的词表行
 * 格式: 单词 [音标] 词性.释义（可能有多种格式变体）
 * 示例:
 *   abandon [əˈbændən] vt.丢弃;放弃,抛弃;遗弃
 *   ability [əˈbɪlɪtɪ] n.能力;能耐,本领;专门技能,天赋
 */
function parseMahavivoline(line: string): WordEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 跳过标题行、空行、纯数字行、段落标题
  if (/^[A-Z]$/.test(trimmed)) return null;
  if (/^\(/.test(trimmed)) return null;
  if (/^[^a-zA-Z]/.test(trimmed)) return null;

  // 匹配模式: 单词 [音标] 内容
  const bracketMatch = trimmed.match(/^([a-zA-Z][a-zA-Z\s'-]*?)\s*\[([^\]]*)\]\s*(.*)/);
  if (bracketMatch) {
    const word = bracketMatch[1].trim().toLowerCase();
    const phonetic = bracketMatch[2].trim();
    const rest = bracketMatch[3].trim();

    // 从 rest 中提取词性和释义
    const posMatch = rest.match(/^([a-z]+\.)\s*(.*)/);
    let partOfSpeech = "";
    let definition = "";

    if (posMatch) {
      partOfSpeech = posMatch[1];
      definition = posMatch[2];
    } else {
      definition = rest;
    }

    if (!word || word.length < 2) return null;

    return {
      word,
      phonetic: `/${phonetic}/`,
      definition: definition || "",
      partOfSpeech,
      example: "",
      exampleTranslation: "",
      difficulty: estimateDifficulty(word),
    };
  }

  // 没有音标的格式: 单词 释义
  const simpleMatch = trimmed.match(/^([a-zA-Z][a-zA-Z'-]*)\s+(.*)/);
  if (simpleMatch) {
    const word = simpleMatch[1].trim().toLowerCase();
    const rest = simpleMatch[2].trim();

    // 如果 rest 包含中文字符，认为它是释义
    if (/[\u4e00-\u9fff]/.test(rest) || /^[a-z]+\./.test(rest)) {
      const posMatch = rest.match(/^([a-z]+\.)\s*(.*)/);
      let partOfSpeech = "";
      let definition = "";

      if (posMatch) {
        partOfSpeech = posMatch[1];
        definition = posMatch[2];
      } else {
        definition = rest;
      }

      return {
        word,
        phonetic: "",
        definition,
        partOfSpeech,
        example: "",
        exampleTranslation: "",
        difficulty: estimateDifficulty(word),
      };
    }
  }

  return null;
}

/**
 * 解析 TOEFL 格式的词表行（列对齐格式）
 * 格式: 单词           [音标]              释义
 */
function parseToeflLine(line: string): WordEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (/^[^a-zA-Z]/.test(trimmed)) return null;

  // 按多个空格分割
  const parts = trimmed.split(/\s{2,}/);
  if (parts.length < 2) return null;

  const word = parts[0].trim().toLowerCase();
  if (!word || word.length < 2) return null;

  let phonetic = "";
  let definition = "";

  if (parts.length >= 3) {
    phonetic = parts[1].trim().replace(/^\[/, "").replace(/\]$/, "");
    definition = parts.slice(2).join(" ").trim();
  } else {
    // 两部分：可能是 单词 释义 或 单词 [音标] 释义
    const secondPart = parts[1].trim();
    if (secondPart.startsWith("[")) {
      const bracketEnd = secondPart.indexOf("]");
      if (bracketEnd !== -1) {
        phonetic = secondPart.slice(1, bracketEnd);
        definition = secondPart.slice(bracketEnd + 1).trim();
      }
    } else {
      definition = secondPart;
    }
  }

  if (phonetic) {
    phonetic = `/${phonetic}/`;
  }

  // 提取词性
  const posMatch = definition.match(/^([a-z]+\.)\s*(.*)/);
  let partOfSpeech = "";
  if (posMatch) {
    partOfSpeech = posMatch[1];
    definition = posMatch[2];
  }

  return {
    word,
    phonetic,
    definition,
    partOfSpeech,
    example: "",
    exampleTranslation: "",
    difficulty: estimateDifficulty(word),
  };
}

/** 将 WordEntry 数组写入分批 JSON 文件 */
function writeBatchFiles(dir: string, words: WordEntry[]): void {
  const dirPath = path.join(SEED_DIR, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  // 清除旧的 words-*.json 文件
  const existingFiles = fs.readdirSync(dirPath).filter((f) => f.startsWith("words-") && f.endsWith(".json"));
  for (const f of existingFiles) {
    fs.unlinkSync(path.join(dirPath, f));
  }

  let batchNum = 1;
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const filename = `words-${String(batchNum).padStart(3, "0")}.json`;
    fs.writeFileSync(path.join(dirPath, filename), JSON.stringify(batch, null, 2), "utf-8");
    batchNum++;
  }

  // 更新 meta.json 中的 wordCount
  const metaPath = path.join(dirPath, "meta.json");
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    meta.wordCount = words.length;
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
  }

  console.log(`  ✅ ${dir}: ${words.length} 个单词，${batchNum - 1} 个批次文件`);
}

// ===== 各词库处理逻辑 =====

/** 处理 mahavivo 格式的词表（CET4, CET6, 考研, GRE） */
async function processMahavivo(
  dir: string,
  url: string,
  parseFn: (line: string) => WordEntry | null = parseMahavivoline
): Promise<void> {
  console.log(`  📥 下载: ${url.split("/").pop()}`);
  const text = await fetchText(url);
  const lines = text.split("\n");

  const words: WordEntry[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const entry = parseFn(line);
    if (entry && !seen.has(entry.word)) {
      seen.add(entry.word);
      words.push(entry);
    }
  }

  writeBatchFiles(dir, words);
}

/** 处理 TOEFL 格式（列对齐） */
async function processToefl(dir: string, url: string): Promise<void> {
  console.log(`  📥 下载: ${url.split("/").pop()}`);
  const text = await fetchText(url);
  const lines = text.split("\n");

  const words: WordEntry[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const entry = parseToeflLine(line);
    if (entry && !seen.has(entry.word)) {
      seen.add(entry.word);
      words.push(entry);
    }
  }

  writeBatchFiles(dir, words);
}

/** 处理 IELTS（纯单词列表，需百度翻译） */
async function processIelts(dir: string, url: string): Promise<void> {
  if (!BAIDU_APPID || !BAIDU_KEY) {
    console.error("  ❌ IELTS 需要百度翻译 API，请配置 .env");
    return;
  }

  console.log(`  📥 下载: ${url.split("/").pop()}`);
  const text = await fetchText(url);
  const rawWords = text
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2 && /^[a-z]/.test(w));

  const uniqueWords = [...new Set(rawWords)];
  console.log(`  📝 共 ${uniqueWords.length} 个唯一单词，开始批量翻译...`);

  const words: WordEntry[] = [];
  // 百度翻译支持一次翻译多行（用换行符分隔），每批最多翻译 10 个词
  const translateBatchSize = 10;

  for (let i = 0; i < uniqueWords.length; i += translateBatchSize) {
    const batch = uniqueWords.slice(i, i + translateBatchSize);
    const translations = await baiduTranslateBatch(batch);
    await sleep(BAIDU_DELAY_MS);

    for (let j = 0; j < batch.length; j++) {
      words.push({
        word: batch[j],
        phonetic: "",
        definition: translations[j] || batch[j],
        partOfSpeech: "",
        example: "",
        exampleTranslation: "",
        difficulty: estimateDifficulty(batch[j]),
      });
    }

    if ((i / translateBatchSize) % 50 === 0) {
      const progress = Math.min(i + translateBatchSize, uniqueWords.length);
      console.log(`  🔄 进度: ${progress}/${uniqueWords.length}`);
    }
  }

  writeBatchFiles(dir, words);
}

// ===== 主逻辑 =====
async function main() {
  console.log("🚀 开始下载和解析词库数据...\n");

  // CET-4: mahavivo 格式
  console.log("\n📚 CET-4:");
  await processMahavivo(
    "cet4",
    "https://raw.githubusercontent.com/mahavivo/english-wordlists/master/CET4_edited.txt"
  );

  // CET-6: mahavivo 格式
  console.log("\n📚 CET-6:");
  await processMahavivo(
    "cet6",
    "https://raw.githubusercontent.com/mahavivo/english-wordlists/master/CET6_edited.txt"
  );

  // 考研: mahavivo NPEE 格式（与 CET4 类似）
  console.log("\n📚 考研英语:");
  await processMahavivo(
    "postgrad",
    "https://raw.githubusercontent.com/mahavivo/english-wordlists/master/NPEE_Wordlist.txt"
  );

  // TOEFL: 列对齐格式（使用完整版 TOEFL.txt）
  console.log("\n📚 TOEFL:");
  await processToefl(
    "toefl",
    "https://raw.githubusercontent.com/mahavivo/english-wordlists/master/TOEFL.txt"
  );

  // GRE: mahavivo 格式
  console.log("\n📚 GRE:");
  await processMahavivo(
    "gre",
    "https://raw.githubusercontent.com/mahavivo/english-wordlists/master/GRE_abridged.txt"
  );

  // IELTS: 纯单词列表，需百度翻译
  console.log("\n📚 IELTS:");
  await processIelts(
    "ielts",
    "https://raw.githubusercontent.com/jimuyouyou/all-ielts-words/main/allKeyWords.txt"
  );

  console.log("\n🎉 全部词库数据下载和解析完成！");
  console.log("\n下一步: 运行 seed 脚本导入数据库:");
  console.log("  npx tsx prisma/seed/index.ts");
}

main().catch((err) => {
  console.error("脚本出错:", err);
  process.exit(1);
});
