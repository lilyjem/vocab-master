/**
 * 词库数据批量生成脚本
 *
 * 使用 Free Dictionary API 获取英文词典数据（音标、词性、英文释义、英文例句）
 * 使用百度翻译 API 将英文释义和例句翻译成中文
 *
 * 运行: npx tsx prisma/seed/generate-words.ts <词库目录名>
 * 示例: npx tsx prisma/seed/generate-words.ts cet4
 *
 * 前提：
 * - 在对应目录下放置 meta.json（词库元信息）
 * - 在对应目录下放置 wordlist.txt（每行一个英文单词）
 * - .env 中配置 BAIDU_TRANSLATE_APPID 和 BAIDU_TRANSLATE_SECRET
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
const BAIDU_KEY = process.env.BAIDU_TRANSLATE_SECRET || process.env.BAIDU_TRANSLATE_KEY || "";

if (!BAIDU_APPID || !BAIDU_KEY) {
  console.error("❌ 缺少百度翻译 API 凭证，请在 .env 中配置 BAIDU_TRANSLATE_APPID 和 BAIDU_TRANSLATE_SECRET");
  process.exit(1);
}

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

// ===== 常量 =====
const BATCH_SIZE = 200;
// 百度翻译 QPS 限制：尊享版 QPS=100，保守用 8（留余量给并发）
const BAIDU_DELAY_MS = 130;
// Free Dictionary API 限制：1000/h，约 3.6/s，保守用 350ms 间隔
const DICT_DELAY_MS = 350;

// ===== 工具函数 =====
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 百度翻译签名 */
function baiduSign(q: string, salt: string): string {
  return crypto
    .createHash("md5")
    .update(BAIDU_APPID + q + salt + BAIDU_KEY)
    .digest("hex");
}

/** 调用百度翻译 API */
async function baiduTranslate(text: string, from = "en", to = "zh"): Promise<string> {
  const salt = Date.now().toString();
  const sign = baiduSign(text, salt);

  const params = new URLSearchParams({
    q: text,
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
      return data.trans_result.map((r: { dst: string }) => r.dst).join("；");
    }
    if (data.error_code) {
      console.warn(`  ⚠ 百度翻译错误 [${data.error_code}]: ${data.error_msg} (text=${text.slice(0, 30)})`);
    }
    return "";
  } catch (err) {
    console.warn(`  ⚠ 百度翻译请求失败: ${err}`);
    return "";
  }
}

/** 调用 Free Dictionary API 获取词典数据 */
async function fetchDictionary(word: string): Promise<{
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
} | null> {
  try {
    const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!resp.ok) return null;

    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || "";

    // 取第一个有意义的 meaning
    let partOfSpeech = "";
    let definition = "";
    let example = "";

    for (const meaning of entry.meanings || []) {
      partOfSpeech = meaning.partOfSpeech || "";
      for (const def of meaning.definitions || []) {
        if (def.definition) {
          definition = def.definition;
          example = def.example || "";
          break;
        }
      }
      if (definition) break;
    }

    return { phonetic, partOfSpeech, definition, example };
  } catch {
    return null;
  }
}

/** 词性英文缩写映射 */
function shortenPOS(pos: string): string {
  const map: Record<string, string> = {
    noun: "n.",
    verb: "v.",
    adjective: "adj.",
    adverb: "adv.",
    pronoun: "pron.",
    preposition: "prep.",
    conjunction: "conj.",
    interjection: "interj.",
    determiner: "det.",
    exclamation: "excl.",
  };
  return map[pos.toLowerCase()] || pos;
}

/** 根据词长和词频估算难度 */
function estimateDifficulty(word: string): number {
  const len = word.length;
  if (len <= 4) return 1;
  if (len <= 6) return 2;
  if (len <= 8) return 3;
  if (len <= 11) return 4;
  return 5;
}

// ===== 主逻辑 =====
async function processWord(word: string): Promise<WordEntry | null> {
  // 1. 从 Free Dictionary API 获取英文数据
  const dict = await fetchDictionary(word);
  await sleep(DICT_DELAY_MS);

  if (!dict || !dict.definition) {
    console.warn(`  ⚠ 词典无数据: ${word}`);
    // 没有词典数据时用百度翻译做备选
    const cnDef = await baiduTranslate(word);
    await sleep(BAIDU_DELAY_MS);
    if (!cnDef) return null;

    return {
      word,
      phonetic: "",
      definition: cnDef,
      partOfSpeech: "",
      example: "",
      exampleTranslation: "",
      difficulty: estimateDifficulty(word),
    };
  }

  // 2. 百度翻译英文释义 → 中文
  const cnDefinition = await baiduTranslate(dict.definition);
  await sleep(BAIDU_DELAY_MS);

  // 3. 百度翻译英文例句 → 中文
  let cnExample = "";
  if (dict.example) {
    cnExample = await baiduTranslate(dict.example);
    await sleep(BAIDU_DELAY_MS);
  }

  return {
    word,
    phonetic: dict.phonetic,
    definition: cnDefinition || dict.definition,
    partOfSpeech: shortenPOS(dict.partOfSpeech),
    example: dict.example,
    exampleTranslation: cnExample,
    difficulty: estimateDifficulty(word),
  };
}

async function main() {
  const bookDir = process.argv[2];
  if (!bookDir) {
    console.error("用法: npx tsx prisma/seed/generate-words.ts <词库目录名>");
    console.error("示例: npx tsx prisma/seed/generate-words.ts cet4");
    process.exit(1);
  }

  const seedDir = path.join(__dirname, bookDir);
  const wordlistPath = path.join(seedDir, "wordlist.txt");
  const metaPath = path.join(seedDir, "meta.json");

  if (!fs.existsSync(wordlistPath)) {
    console.error(`❌ 单词列表不存在: ${wordlistPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(metaPath)) {
    console.error(`❌ 元信息不存在: ${metaPath}`);
    process.exit(1);
  }

  // 读取单词列表
  const rawWords = fs.readFileSync(wordlistPath, "utf-8")
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0 && !w.startsWith("#"));

  // 去重
  const words = [...new Set(rawWords)];
  console.log(`\n📚 词库: ${bookDir}`);
  console.log(`📝 待处理单词: ${words.length} 个\n`);

  // 检查已有进度（支持断点续传）
  const existingFiles = fs.readdirSync(seedDir).filter((f) => f.startsWith("words-") && f.endsWith(".json"));
  let processedWords = new Set<string>();

  for (const file of existingFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(seedDir, file), "utf-8"));
      if (Array.isArray(content)) {
        for (const w of content) {
          if (w.word) processedWords.add(w.word.toLowerCase());
        }
      }
    } catch {
      // 忽略无效文件
    }
  }

  if (processedWords.size > 0) {
    console.log(`📂 已有进度: ${processedWords.size} 个单词已生成，跳过这些\n`);
  }

  // 过滤出还没处理的单词
  const remainingWords = words.filter((w) => !processedWords.has(w));
  if (remainingWords.length === 0) {
    console.log("✅ 所有单词已生成完毕！");
    return;
  }

  console.log(`🔄 需要处理: ${remainingWords.length} 个单词\n`);

  // 计算起始批次号
  const startBatch = existingFiles.length + 1;
  let currentBatch: WordEntry[] = [];
  let batchNum = startBatch;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < remainingWords.length; i++) {
    const word = remainingWords[i];
    const progress = `[${i + 1}/${remainingWords.length}]`;

    process.stdout.write(`  ${progress} ${word} ... `);

    const entry = await processWord(word);
    if (entry) {
      currentBatch.push(entry);
      successCount++;
      console.log(`✓ ${entry.definition.slice(0, 20)}`);
    } else {
      failCount++;
      console.log("✗ 跳过");
    }

    // 达到批次大小时写入文件
    if (currentBatch.length >= BATCH_SIZE) {
      const filename = `words-${String(batchNum).padStart(3, "0")}.json`;
      fs.writeFileSync(
        path.join(seedDir, filename),
        JSON.stringify(currentBatch, null, 2),
        "utf-8"
      );
      console.log(`\n  💾 写入 ${filename}: ${currentBatch.length} 个单词\n`);
      batchNum++;
      currentBatch = [];
    }
  }

  // 写入剩余的单词
  if (currentBatch.length > 0) {
    const filename = `words-${String(batchNum).padStart(3, "0")}.json`;
    fs.writeFileSync(
      path.join(seedDir, filename),
      JSON.stringify(currentBatch, null, 2),
      "utf-8"
    );
    console.log(`\n  💾 写入 ${filename}: ${currentBatch.length} 个单词`);
  }

  // 更新 meta.json 中的 wordCount
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  const totalWords = processedWords.size + successCount;
  meta.wordCount = totalWords;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");

  console.log(`\n🎉 完成！`);
  console.log(`   成功: ${successCount}，失败: ${failCount}，总计: ${totalWords}`);
}

main().catch((err) => {
  console.error("脚本出错:", err);
  process.exit(1);
});
