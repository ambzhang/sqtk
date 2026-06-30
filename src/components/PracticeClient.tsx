"use client";

import { useState, useCallback } from "react";
import type { Question, QuestionType } from "@/types";
import { TYPE_LABELS } from "@/types";
import QuestionCard from "./QuestionCard";
import { createClient } from "@/lib/supabase/client";

type Mode = "random" | "sequence";
const TYPES: (QuestionType | "all")[] = ["all", "single", "multi", "judge"];

export default function PracticeClient({
  sources,
  userId,
}: {
  sources: string[];
  userId: string | null;
}) {
  const supabase = createClient();

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<Mode>("random");
  const [source, setSource] = useState("all");
  const [type, setType] = useState<QuestionType | "all">("all");
  const [count, setCount] = useState(20);
  const [loading, setLoading] = useState(false);

  const [queue, setQueue] = useState<Question[]>([]);
  const [cur, setCur] = useState(0);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    // 只抽可判分的题
    let query = supabase
      .from("questions")
      .select("*")
      .eq("quality", "answerable");
    if (source !== "all") query = query.eq("source", source);
    if (type !== "all") query = query.eq("type", type);

    if (mode === "sequence") {
      query = query
        .order("source", { ascending: true })
        .order("seq", { ascending: true })
        .limit(count);
      const { data } = await query;
      setLoading(false);
      return (data ?? []) as Question[];
    } else {
      // 随机:多取一些再前端打乱抽取
      const pool = Math.min(count * 6, 600);
      query = query.limit(pool);
      const { data } = await query;
      const shuffled = [...(data ?? [])].sort(() => Math.random() - 0.5).slice(0, count);
      setLoading(false);
      return shuffled as Question[];
    }
  }, [supabase, source, type, mode, count]);

  async function start() {
    const qs = await fetchQuestions();
    if (qs.length === 0) {
      alert("没有符合条件的可判分题目,请调整筛选条件");
      return;
    }
    setQueue(qs);
    setCur(0);
    setDone(0);
    setCorrect(0);
    setAnsweredCurrent(false);
    setStarted(true);
  }

  function handleAnswered(ok: boolean) {
    setDone((d) => d + 1);
    if (ok) setCorrect((c) => c + 1);
    setAnsweredCurrent(true);
  }

  function next() {
    if (cur < queue.length - 1) {
      setCur((c) => c + 1);
      setAnsweredCurrent(false);
    } else {
      setStarted(false); // 结束 -> 展示结算
      setShowResult(true);
    }
  }

  function restart() {
    setShowResult(false);
    setStarted(false);
    setQueue([]);
  }

  // ---------- 结算页 ----------
  if (showResult) {
    const rate = done ? Math.round((correct / done) * 100) : 0;
    return (
      <div className="card animate-fade-in p-8 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="mt-4 text-xl font-bold">本轮完成!</h2>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <ResultStat label="作答" value={done} />
          <ResultStat label="正确" value={correct} accent="green" />
          <ResultStat label="正确率" value={`${rate}%`} accent={rate >= 60 ? "green" : "red"} />
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={restart} className="btn-primary">再来一轮</button>
        </div>
      </div>
    );
  }

  // ---------- 配置页 ----------
  if (!started) {
    return (
      <div className="card animate-fade-in p-6">
        <h2 className="text-lg font-bold">配置刷题</h2>
        <div className="mt-5 space-y-5">
          <Field label="刷题模式">
            <div className="grid grid-cols-2 gap-2">
              {([["random", "🎲 随机抽题"], ["sequence", "📑 顺序刷题"]] as const).map(([m, l]) => (
                <button
                  key={m}
                  onClick={() => setMode(m as Mode)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    mode === m
                      ? "border-brand-400 bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-300"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Field>

          <Field label="题型">
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    type === t
                      ? "bg-brand-500 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {t === "all" ? "全部" : TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="来源">
            <select value={source} onChange={(e) => setSource(e.target.value)} className="input">
              <option value="all">全部来源</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label={`题量:${count} 题`}>
            <input
              type="range" min={5} max={100} step={5}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
          </Field>

          {!userId && (
            <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              提示:未登录也可刷题,但答题记录和错题本不会被保存。
            </div>
          )}

          <button onClick={start} disabled={loading} className="btn-primary w-full">
            {loading ? "准备题目中…" : "开始刷题"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- 刷题页 ----------
  const q = queue[cur];
  const progress = Math.round(((cur) / queue.length) * 100);

  return (
    <div className="animate-fade-in">
      {/* 进度条 */}
      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-xs text-slate-500">
          <span>进度 {cur + 1} / {queue.length}</span>
          <span>正确 {correct} / {done}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={q}
        userId={userId}
        onAnswered={handleAnswered}
        index={cur}
        total={queue.length}
      />

      <div className="mt-4 flex justify-end">
        <button
          onClick={next}
          disabled={!answeredCurrent}
          className="btn-primary"
        >
          {cur < queue.length - 1 ? "下一题 →" : "完成本轮"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      {children}
    </div>
  );
}

function ResultStat({
  label, value, accent,
}: { label: string; value: string | number; accent?: "green" | "red" }) {
  const color =
    accent === "green" ? "text-green-600 dark:text-green-400"
    : accent === "red" ? "text-red-500 dark:text-red-400"
    : "text-brand-600 dark:text-brand-300";
  return (
    <div className="rounded-xl bg-slate-50 py-4 dark:bg-slate-700/40">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}
