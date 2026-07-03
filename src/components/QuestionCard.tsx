"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question } from "@/types";
import { TYPE_LABELS } from "@/types";
import {
  getDisplayOptions,
  getCorrectLetters,
  grade,
  optionLetter,
} from "@/lib/grade";
import { createClient } from "@/lib/supabase/client";
import SimpleMarkdown from "./SimpleMarkdown";

interface Props {
  question: Question;
  /** 是否已登录(决定是否记录答题/收藏) */
  userId: string | null;
  /** 答题完成回调(用于刷题序列推进与统计) */
  onAnswered?: (isCorrect: boolean) => void;
  /** 初始是否已收藏 */
  initialFav?: boolean;
  /** 是否显示题目序号信息 */
  index?: number;
  total?: number;
}

export default function QuestionCard({
  question,
  userId,
  onAnswered,
  initialFav = false,
  index,
  total,
}: Props) {
  const supabase = createClient();
  const options = getDisplayOptions(question);
  const correct = useMemo(() => getCorrectLetters(question), [question]);
  const isMulti = question.type === "multi";
  const answerable = question.quality === "answerable";

  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [fav, setFav] = useState(initialFav);
  const [favBusy, setFavBusy] = useState(false);

  // AI 解析状态
  const [aiText, setAiText] = useState<string>(question.ai_explanation || "");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>("");

  // 题目切换时重置
  useEffect(() => {
    setSelected([]);
    setSubmitted(false);
    setIsCorrect(false);
    setFav(initialFav);
    setAiText(question.ai_explanation || "");
    setAiLoading(false);
    setAiError("");
  }, [question.id, initialFav, question.ai_explanation]);

  async function generateAiExplain() {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
      const data = await res.json();
      if (data.ok && data.explanation) {
        setAiText(data.explanation);
      } else {
        setAiError(data.error || "生成失败,请稍后重试");
      }
    } catch {
      setAiError("网络错误,请稍后重试");
    } finally {
      setAiLoading(false);
    }
  }

  function toggle(letter: string) {
    if (submitted) return;
    if (isMulti) {
      setSelected((prev) =>
        prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter]
      );
    } else {
      setSelected([letter]);
    }
  }

  async function submit() {
    if (selected.length === 0 || submitted) return;
    const ok = grade(question, selected);
    setIsCorrect(ok);
    setSubmitted(true);
    onAnswered?.(ok);

    if (userId) {
      // 记录答题
      await supabase.from("attempts").insert({
        user_id: userId,
        question_id: question.id,
        user_answer: selected.sort().join(""),
        is_correct: ok,
      });
      // 维护错题本
      if (!ok) {
        const { data: existing } = await supabase
          .from("wrong_questions")
          .select("wrong_count")
          .eq("user_id", userId)
          .eq("question_id", question.id)
          .maybeSingle();
        await supabase.from("wrong_questions").upsert(
          {
            user_id: userId,
            question_id: question.id,
            wrong_count: (existing?.wrong_count ?? 0) + 1,
            resolved: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,question_id" }
        );
      } else {
        // 答对则把错题标记为已订正
        await supabase
          .from("wrong_questions")
          .update({ resolved: true, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("question_id", question.id);
      }
    }
  }

  async function toggleFav() {
    if (!userId) {
      alert("请先登录后再收藏");
      return;
    }
    setFavBusy(true);
    try {
      if (fav) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("question_id", question.id);
        setFav(false);
      } else {
        await supabase
          .from("favorites")
          .upsert({ user_id: userId, question_id: question.id }, { onConflict: "user_id,question_id" });
        setFav(true);
      }
    } finally {
      setFavBusy(false);
    }
  }

  function optionState(letter: string): "default" | "selected" | "correct" | "wrong" {
    if (!submitted) return selected.includes(letter) ? "selected" : "default";
    if (correct.includes(letter)) return "correct";
    if (selected.includes(letter)) return "wrong";
    return "default";
  }

  const stateClass: Record<string, string> = {
    default:
      "border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-600 dark:hover:bg-slate-700/40",
    selected: "border-brand-400 bg-brand-50 dark:bg-brand-900/30 dark:border-brand-500",
    correct: "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600",
    wrong: "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600",
  };

  return (
    <div className="card animate-fade-in p-5 sm:p-6">
      {/* 头部:题型标签 + 序号 + 收藏 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            {TYPE_LABELS[question.type]}
          </span>
          {!answerable && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
              仅供浏览
            </span>
          )}
          {typeof index === "number" && typeof total === "number" && (
            <span className="text-xs text-slate-400">
              {index + 1} / {total}
            </span>
          )}
        </div>
        <button
          onClick={toggleFav}
          disabled={favBusy}
          className="text-xl transition active:scale-90"
          aria-label="收藏"
          title={fav ? "取消收藏" : "收藏"}
        >
          {fav ? "⭐" : "☆"}
        </button>
      </div>

      {/* 题干 */}
      <div className="text-[15px] font-medium leading-relaxed text-slate-800 dark:text-slate-100">
        {question.question}
      </div>

      {/* 选项 */}
      {options.length > 0 ? (
        <div className="mt-4 space-y-2.5">
          {options.map((opt, i) => {
            const letter = optionLetter(i);
            const st = optionState(letter);
            return (
              <button
                key={i}
                onClick={() => toggle(letter)}
                disabled={submitted || !answerable}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${stateClass[st]} ${
                  submitted || !answerable ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                    st === "selected"
                      ? "border-brand-500 bg-brand-500 text-white"
                      : st === "correct"
                      ? "border-green-500 bg-green-500 text-white"
                      : st === "wrong"
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-slate-300 text-slate-400 dark:border-slate-500"
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1 leading-relaxed">
                  {/* 去掉选项里重复的 "A. " 前缀显示 */}
                  {opt.replace(/^[A-Z][.、)]\s*/, "")}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-700/40">
          本题为{TYPE_LABELS[question.type]},无标准选项,请参考下方解析作答。
        </div>
      )}

      {/* 操作区 */}
      <div className="mt-5 flex items-center gap-3">
        {answerable && options.length > 0 && !submitted && (
          <button onClick={submit} disabled={selected.length === 0} className="btn-primary">
            提交答案
          </button>
        )}
        {isMulti && !submitted && (
          <span className="text-xs text-slate-400">多选题,可选多个选项</span>
        )}
        {submitted && (
          <span
            className={`animate-pop rounded-lg px-3 py-1.5 text-sm font-semibold ${
              isCorrect
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            }`}
          >
            {isCorrect ? "✓ 回答正确" : "✗ 回答错误"}
          </span>
        )}
      </div>

      {/* 答案与解析 */}
      {(submitted || !answerable) && (
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-700">
          {question.answer && (
            <div className="text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">正确答案:</span>{" "}
              <span className="font-bold text-green-600 dark:text-green-400">
                {question.type === "judge"
                  ? correct[0] === "A"
                    ? "正确"
                    : correct[0] === "B"
                    ? "错误"
                    : question.answer
                  : correct.join("") || question.answer}
              </span>
            </div>
          )}
          {question.explanation && (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">解析:</span>{" "}
              {question.explanation}
            </div>
          )}
          {!question.answer && !question.explanation && (
            <div className="text-sm text-slate-400">本题暂无答案与解析。</div>
          )}
        </div>
      )}

      {/* AI 一键解析 */}
      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
        {!aiText && !aiLoading && (
          <button
            onClick={generateAiExplain}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-100 active:scale-95 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50"
          >
            <span>✨</span>
            <span>AI 一键解析</span>
          </button>
        )}

        {aiLoading && (
          <div className="flex items-center gap-2 text-sm text-brand-500">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
            AI 正在生成解析…
          </div>
        )}

        {aiError && (
          <div className="mt-2 flex items-center gap-3 text-sm text-red-500">
            <span>{aiError}</span>
            <button onClick={generateAiExplain} className="underline">
              重试
            </button>
          </div>
        )}

        {aiText && (
          <div className="animate-fade-in rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-transparent p-4 dark:border-brand-800/60 dark:from-brand-900/20">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300">
              <span>✨</span>
              <span>AI 解析</span>
              <button
                onClick={generateAiExplain}
                disabled={aiLoading}
                className="ml-auto text-xs font-normal text-slate-400 underline hover:text-brand-500"
                title="重新生成"
              >
                重新生成
              </button>
            </div>
            <SimpleMarkdown content={aiText} />
          </div>
        )}
      </div>
    </div>
  );
}
