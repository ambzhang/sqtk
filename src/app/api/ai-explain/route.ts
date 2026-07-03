import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * AI 一键解析接口(流式 SSE + 推理过程)
 *
 * 流程:
 *   1. 前端 POST { questionId, force?, fallback? }
 *      - fallback 是前端携带的题目内容,用于数据库查不到 id 时兜底
 *   2. 服务端用 service_role 读该题;查不到则用 fallback
 *   3. 命中缓存(ai_explanation)且非 force -> 直接把缓存作为最终结果流式回放
 *   4. 否则调 DeepSeek 推理模型(deepseek-reasoner)流式生成:
 *        - reasoning_content -> 作为「解析过程」实时推给前端
 *        - content           -> 作为「最终解析」实时推给前端
 *   5. 生成完把最终解析写回缓存
 *
 * SSE 事件格式(每行 data: {json}\n\n):
 *   { "type": "reasoning", "delta": "..." }   思考过程增量
 *   { "type": "answer",    "delta": "..." }   最终解析增量
 *   { "type": "done",      "cached": bool }   结束
 *   { "type": "error",     "error": "..." }   出错
 *
 * 环境变量(Vercel):
 *   DEEPSEEK_API_KEY            必填
 *   NEXT_PUBLIC_SUPABASE_URL    已有
 *   SUPABASE_SERVICE_ROLE_KEY   已有(仅服务端)
 * 可选:
 *   DEEPSEEK_MODEL  默认 deepseek-reasoner
 */

export const runtime = "nodejs";
export const maxDuration = 120;

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

type QLike = {
  type: string;
  question: string;
  options: string[];
  answer: string;
};

function readableAnswer(q: QLike): string {
  const a = (q.answer || "").trim();
  if (!a) return "(题库未提供标准答案)";
  if (q.type === "judge") {
    const u = a.toUpperCase();
    if (/^(对|正确|A|T|√|TRUE)$/.test(u)) return "正确";
    if (/^(错|错误|B|F|×|FALSE)$/.test(u)) return "错误";
    return a;
  }
  const letters = a.toUpperCase().split("").filter((c) => /[A-Z]/.test(c));
  if (letters.length === 0) return a;
  const parts = letters.map((L) => {
    const idx = L.charCodeAt(0) - 65;
    const opt = q.options?.[idx];
    return opt ? `${L}(${opt.replace(/^[A-Z][.、)]\s*/, "")})` : L;
  });
  return parts.join("、");
}

function buildPrompt(q: QLike): { system: string; user: string } {
  const typeLabel = TYPE_LABELS[q.type] || "题目";
  const optionsText =
    q.options && q.options.length > 0 ? q.options.join("\n") : "(本题无选项)";
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

// 组装一条 SSE 行
function sse(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // 解析请求体
  let body: {
    questionId?: string;
    force?: boolean;
    fallback?: Partial<QLike>;
  } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(sse({ type: "error", error: "bad_json" }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
  }

  const questionId = String(body.questionId || "").trim();
  const db = admin();
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-reasoner";

  // 先把题目内容准备好:优先数据库,查不到用 fallback
  let q: QLike | null = null;
  let cached = "";

  if (db && questionId) {
    const { data } = await db
      .from("questions")
      .select("id, type, question, options, answer, ai_explanation")
      .eq("id", questionId)
      .maybeSingle();
    if (data) {
      q = {
        type: data.type,
        question: data.question,
        options: Array.isArray(data.options) ? (data.options as string[]) : [],
        answer: data.answer || "",
      };
      cached = data.ai_explanation || "";
    }
  }

  // 数据库没查到 -> 用前端兜底内容
  if (!q && body.fallback && body.fallback.question) {
    q = {
      type: body.fallback.type || "unknown",
      question: body.fallback.question || "",
      options: Array.isArray(body.fallback.options)
        ? body.fallback.options
        : [],
      answer: body.fallback.answer || "",
    };
  }

  if (!q || !q.question) {
    return new Response(
      sse({ type: "error", error: "题目不存在,且未提供题目内容" }),
      {
        status: 404,
        headers: { "Content-Type": "text/event-stream; charset=utf-8" },
      }
    );
  }

  const theQ = q; // 确定非空,便于闭包内使用

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(sse(obj)));

      try {
        // 命中缓存且非强制 -> 直接把缓存当最终结果流式回放(分块模拟打字)
        if (cached && !body.force) {
          const chunkSize = 24;
          for (let i = 0; i < cached.length; i += chunkSize) {
            send({ type: "answer", delta: cached.slice(i, i + chunkSize) });
          }
          send({ type: "done", cached: true });
          controller.close();
          return;
        }

        if (!apiKey) {
          send({ type: "error", error: "服务端未配置 DEEPSEEK_API_KEY" });
          controller.close();
          return;
        }

        const { system, user } = buildPrompt(theQ);

        const resp = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: 0.5,
            stream: true,
          }),
        });

        if (!resp.ok || !resp.body) {
          const errText = await resp.text().catch(() => "");
          send({
            type: "error",
            error: `AI 服务返回错误 (${resp.status})`,
            detail: errText.slice(0, 300),
          });
          controller.close();
          return;
        }

        // 解析 DeepSeek 的 SSE 流
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalAnswer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // 按行处理
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // 最后一段可能不完整,留到下次

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta;
              if (!delta) continue;
              // 思考过程
              if (delta.reasoning_content) {
                send({ type: "reasoning", delta: delta.reasoning_content });
              }
              // 最终解析
              if (delta.content) {
                finalAnswer += delta.content;
                send({ type: "answer", delta: delta.content });
              }
            } catch {
              // 忽略解析不了的行
            }
          }
        }

        finalAnswer = finalAnswer.trim();

        // 写回缓存(失败不影响)
        if (finalAnswer && db && questionId) {
          await db
            .from("questions")
            .update({
              ai_explanation: finalAnswer,
              ai_explained_at: new Date().toISOString(),
            })
            .eq("id", questionId)
            .then(
              () => {},
              () => {}
            );
        }

        send({ type: "done", cached: false });
        controller.close();
      } catch (e) {
        try {
          send({ type: "error", error: "生成失败", detail: String(e).slice(0, 200) });
        } catch {
          /* ignore */
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
