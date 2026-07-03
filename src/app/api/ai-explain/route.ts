import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * AI 一键解析接口
 *
 * 流程:
 *   1. 前端传 questionId
 *   2. 服务端用 service_role 读该题(题干/选项/答案)
 *   3. 先看数据库有没有缓存的 ai_explanation,有则直接返回(省钱省时)
 *   4. 没有则组 prompt 调 DeepSeek,拿到解析后写回缓存,再返回
 *
 * 环境变量(在 Vercel 配置):
 *   DEEPSEEK_API_KEY              -> DeepSeek 的 API Key(https://platform.deepseek.com)
 *   NEXT_PUBLIC_SUPABASE_URL      -> 已有
 *   SUPABASE_SERVICE_ROLE_KEY     -> 已有(仅服务端使用,不暴露前端)
 *
 * 可选:
 *   DEEPSEEK_MODEL  -> 默认 deepseek-chat
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const TYPE_LABELS: Record<string, string> = {
  single: "单选题",
  multi: "多选题",
  judge: "判断题",
  essay: "简答题",
  unknown: "题目",
};

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// 把答案字母转成可读文本
function readableAnswer(q: {
  type: string;
  answer: string;
  options: string[];
}): string {
  const a = (q.answer || "").trim();
  if (!a) return "(题库未提供标准答案)";
  if (q.type === "judge") {
    const u = a.toUpperCase();
    if (/^(对|正确|A|T|√|TRUE)$/.test(u)) return "正确";
    if (/^(错|错误|B|F|×|FALSE)$/.test(u)) return "错误";
    return a;
  }
  // 选择题:把字母映射到选项文本
  const letters = a.toUpperCase().split("").filter((c) => /[A-Z]/.test(c));
  if (letters.length === 0) return a;
  const parts = letters.map((L) => {
    const idx = L.charCodeAt(0) - 65;
    const opt = q.options?.[idx];
    return opt ? `${L}(${opt.replace(/^[A-Z][.、)]\s*/, "")})` : L;
  });
  return parts.join("、");
}

function buildPrompt(q: {
  type: string;
  question: string;
  options: string[];
  answer: string;
}): { system: string; user: string } {
  const typeLabel = TYPE_LABELS[q.type] || "题目";
  const optionsText =
    q.options && q.options.length > 0
      ? q.options.join("\n")
      : "(本题无选项)";
  const answerText = readableAnswer(q);

  const system =
    "你是一位资深的社区工作者考试辅导老师。请针对给定的题目给出清晰、准确、条理分明的解析。" +
    "解析要点:1) 先点明正确答案为什么对;2) 逐一说明其他选项为什么错(若有选项);3) 补充相关知识点或记忆技巧。" +
    "语言简洁专业,使用 Markdown 格式(可用小标题、加粗、列表),不要寒暄,直接给解析。";

  const user = [
    `【题型】${typeLabel}`,
    `【题目】${q.question}`,
    `【选项】\n${optionsText}`,
    `【标准答案】${answerText}`,
    ``,
    `请生成这道题的详细解析。`,
  ].join("\n");

  return { system, user };
}

export async function POST(req: NextRequest) {
  const db = admin();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "服务端未配置 Supabase(缺少 SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  let body: { questionId?: string; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const questionId = String(body.questionId || "").trim();
  if (!questionId) {
    return NextResponse.json({ ok: false, error: "缺少 questionId" }, { status: 400 });
  }

  // 1. 读题
  const { data: q, error: qErr } = await db
    .from("questions")
    .select("id, type, question, options, answer, ai_explanation")
    .eq("id", questionId)
    .maybeSingle();

  if (qErr || !q) {
    return NextResponse.json({ ok: false, error: "题目不存在" }, { status: 404 });
  }

  // 2. 命中缓存直接返回(除非 force 强制重生成)
  if (q.ai_explanation && !body.force) {
    return NextResponse.json({ ok: true, cached: true, explanation: q.ai_explanation });
  }

  // 3. 调 DeepSeek
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "服务端未配置 DEEPSEEK_API_KEY" },
      { status: 500 }
    );
  }

  const options: string[] = Array.isArray(q.options)
    ? (q.options as string[])
    : [];
  const { system, user } = buildPrompt({
    type: q.type,
    question: q.question,
    options,
    answer: q.answer,
  });

  let explanation = "";
  try {
    const resp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.5,
        stream: false,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `AI 服务返回错误 (${resp.status})`, detail: errText.slice(0, 300) },
        { status: 502 }
      );
    }

    const data = await resp.json();
    explanation = data?.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "调用 AI 服务失败", detail: String(e).slice(0, 200) },
      { status: 502 }
    );
  }

  if (!explanation) {
    return NextResponse.json({ ok: false, error: "AI 未返回解析内容" }, { status: 502 });
  }

  // 4. 写回缓存(失败不影响返回)
  await db
    .from("questions")
    .update({ ai_explanation: explanation, ai_explained_at: new Date().toISOString() })
    .eq("id", questionId);

  return NextResponse.json({ ok: true, cached: false, explanation });
}
