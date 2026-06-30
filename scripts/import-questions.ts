/**
 * 题库导入脚本
 * 把 questions.json 清洗后批量导入 Supabase 的 questions 表。
 *
 * 用法:
 *   1. 在项目根目录建立 .env(参考 .env.example),填好:
 *        NEXT_PUBLIC_SUPABASE_URL
 *        SUPABASE_SERVICE_ROLE_KEY   <- 注意是 service_role,不是 anon
 *   2. 把题库 JSON 放到 scripts/questions.json(或用环境变量 QUESTIONS_FILE 指定路径)
 *   3. 运行:  npm run import:questions
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

config(); // 读取 .env

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const QUESTIONS_FILE =
  process.env.QUESTIONS_FILE || resolve(process.cwd(), "scripts/questions.json");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ 缺少环境变量 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

type RawQuestion = {
  id: string;
  source: string;
  seq?: number;
  number?: number;
  type: string;
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
};

type CleanQuestion = {
  id: string;
  source: string;
  seq: number | null;
  number: number | null;
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  quality: "answerable" | "view_only";
};

const VALID_TYPES = new Set(["single", "multi", "judge", "essay", "unknown"]);

/** 判断一道题是否可判分 */
function judgeQuality(q: RawQuestion): "answerable" | "view_only" {
  const answer = (q.answer || "").trim();
  if (!answer) return "view_only";
  const opts = q.options || [];

  if (q.type === "single" || q.type === "multi") {
    // 需要有选项,且答案是 A-Z 字母
    if (opts.length < 2) return "view_only";
    if (!/^[A-Z]+$/.test(answer)) return "view_only";
    return "answerable";
  }
  if (q.type === "judge") {
    // 判断题:答案应为 对/错 或 A/B/正确/错误/√/×
    const a = answer.toUpperCase();
    if (/^(对|错|正确|错误|A|B|T|F|√|×|TRUE|FALSE)$/.test(a)) return "answerable";
    return "view_only";
  }
  // essay / unknown 一律仅浏览
  return "view_only";
}

function clean(q: RawQuestion): CleanQuestion {
  const type = VALID_TYPES.has(q.type) ? q.type : "unknown";
  return {
    id: q.id,
    source: q.source || "未分类",
    seq: typeof q.seq === "number" ? q.seq : null,
    number: typeof q.number === "number" ? q.number : null,
    type,
    question: (q.question || "").trim(),
    options: Array.isArray(q.options) ? q.options : [],
    answer: (q.answer || "").trim(),
    explanation: (q.explanation || "").trim(),
    quality: judgeQuality(q),
  };
}

async function main() {
  console.log("📖 读取题库文件:", QUESTIONS_FILE);
  const raw = JSON.parse(readFileSync(QUESTIONS_FILE, "utf-8")) as RawQuestion[];
  console.log("   原始题数:", raw.length);

  // 去重(按 id),清洗
  const seen = new Set<string>();
  const cleaned: CleanQuestion[] = [];
  for (const q of raw) {
    if (!q.id || seen.has(q.id)) continue;
    if (!q.question || !q.question.trim()) continue; // 跳过空题干
    seen.add(q.id);
    cleaned.push(clean(q));
  }

  const answerable = cleaned.filter((q) => q.quality === "answerable").length;
  console.log(`   清洗后题数: ${cleaned.length}(可判分 ${answerable} / 仅浏览 ${cleaned.length - answerable})`);

  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false },
  });

  // 分批 upsert(每批 500)
  const BATCH = 500;
  let done = 0;
  for (let i = 0; i < cleaned.length; i += BATCH) {
    const batch = cleaned.slice(i, i + BATCH);
    const { error } = await supabase.from("questions").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error("❌ 批次导入失败:", error.message);
      process.exit(1);
    }
    done += batch.length;
    console.log(`   已导入 ${done}/${cleaned.length}`);
  }

  console.log("✅ 题库导入完成!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
