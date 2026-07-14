"use client";

import { useState, useCallback, useEffect } from "react";
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
  // 跳过已刷过的题(默认开启,仅登录用户生效)
  const [skipSeen, setSkipSeen] = useState(true);

  // 已刷过的题目 id 集合(登录用户)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  // 进度统计
  const [totalAnswerable, setTotalAnswerable] = useState<number | null>(null);

  const [queue, setQueue] = useState<Question[]>([]);
  const [cur, setCur] = useState(0);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [showResult, setShowResult] = useState(false);
  // 本轮结束时是否已把整个题库刷完
  const [allCleared, setAllCleared] = useState(false);

  // 拉取该用户所有已答过的题目 id(分页,规避单次 1000 行上限)
  const loadSeen = useCallback(async () => {
    if (!userId) {
      return new Set<string>();
    }
    const ids = new Set<string>();
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("attempts")
        .select("question_id")
        .eq("user_id", userId)
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      for (const row of data) ids.add(row.question_id as string);
      if (data.length < pageSize) break;
    }
    setSeenIds(ids);
    return ids;
  }, [supabase, userId]);

  // 拉取当前筛选下可判分题目的总数(用于展示进度)
  const loadTotal = useCallback(async () => {
    let q = supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("quality", "answerable");
    if (source !== "all") q = q.eq("source", source);
    if (type !== "all") q = q.eq("type", type);
    const { count: c } = await q;
    setTotalAnswerable(c ?? 0);
  }, [supabase, source, type]);

  // 初次加载 & 筛选变化时刷新已答集合与总数
  useEffect(() => {
    loadSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    loadTotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, type]);

  // 是否真正启用过滤:开关打开 + 已登录 + 集合已加载
  const filterOn = skipSeen && !!userId;

  const fetchQuestions = useCallback(
    async (seen: Set<string>): Promise<{ list: Question[]; cleared: boolean }> => {
      setLoading(true);

      const baseQuery = () => {
        let q = supabase.from("questions").select("*").eq("quality", "answerable");
        if (source !== "all") q = q.eq("source", source);
        if (type !== "all") q = q.eq("type", type);
        return q;
      };

      const useFilter = skipSeen && !!userId;

      if (mode === "sequence") {
        // 顺序模式:按 source/seq 分批拉取,前端跳过已刷过的,凑够 count
        const collected: Question[] = [];
        const pageSize = 500;
        let from = 0;
        let exhausted = false;
        while (collected.length < count) {
          const { data } = await baseQuery()
            .order("source", { ascending: true })
            .order("seq", { ascending: true })
            .range(from, from + pageSize - 1);
          if (!data || data.length === 0) {
            exhausted = true;
            break;
          }
          for (const row of data as Question[]) {
            if (useFilter && seen.has(row.id)) continue;
            collected.push(row);
            if (collected.length >= count) break;
          }
          if (data.length < pageSize) {
            exhausted = true;
            break;
          }
          from += pageSize;
        }
        setLoading(false);
        return { list: collected, cleared: exhausted && collected.length === 0 };
      } else {
        // 随机模式:大池子拉取,前端过滤已刷过的,再打乱抽取
        const pool = Math.min(Math.max(count * 8, 400), 3000);
        const collected: Question[] = [];
        const pageSize = 1000;
        let from = 0;
        let exhausted = false;
        while (collected.length < pool) {
          const { data } = await baseQuery().range(from, from + pageSize - 1);
          if (!data || data.length === 0) {
            exhausted = true;
            break;
          }
          for (const row of data as Question[]) {
            if (useFilter && seen.has(row.id)) continue;
            collected.push(row);
          }
          if (data.length < pageSize) {
            exhausted = true;
            break;
          }
          from += pageSize;
        }
        const shuffled = [...collected].sort(() => Math.random() - 0.5).slice(0, count);
        setLoading(false);
        return { list: shuffled, cleared: exhausted && collected.length === 0 };
      }
    },
    [supabase, source, type, mode, count, skipSeen, userId]
  );

  async function start() {
    // 确保拿到最新的已答集合(答完一轮再来时也要刷新)
    const seen = await loadSeen();
    const { list, cleared } = await fetchQuestions(seen);
    if (list.length === 0) {
      if (cleared || (filterOn && (totalAnswerable ?? 0) > 0)) {
        alert("🎉 当前筛选条件下的题目你已经全部刷完了！换个来源/题型，或关闭「跳过已刷过的题」再练一遍。");
      } else {
        alert("没有符合条件的可判分题目，请调整筛选条件");
      }
      return;
    }
    setQueue(list);
    setCur(0);
    setDone(0);
    setCorrect(0);
    setAnsweredCurrent(false);
    setAllCleared(false);
    setStarted(true);
  }

  function handleAnswered(ok: boolean) {
    setDone((d) => d + 1);
    if (ok) setCorrect((c) => c + 1);
    setAnsweredCurrent(true);
    // 本地即时把当前题记入已刷集合(避免同轮/下轮再出现)
    const q = queue[cur];
    if (q) {
      setSeenIds((prev) => {
        const nx = new Set(prev);
        nx.add(q.id);
        return nx;
      });
    }
  }

  function next() {
    if (cur < queue.length - 1) {
      setCur((c) => c + 1);
      setAnsweredCurrent(false);
    } else {
      // 判断是否已把题库刷完
      const remaining = remainingCount();
      setAllCleared(filterOn && remaining <= 0);
      setStarted(false);
      setShowResult(true);
    }
  }

  function restart() {
    setShowResult(false);
    setStarted(false);
    setQueue([]);
  }

  // 剩余未刷题数(仅在过滤开启时有意义)
  function remainingCount(): number {
    if (totalAnswerable == null) return -1;
    const rem = totalAnswerable - seenIds.size;
    return rem < 0 ? 0 : rem;
  }

  // ---------- 结算页 ----------
  if (showResult) {
    const rate = done ? Math.round((correct / done) * 100) : 0;
    const rem = remainingCount();
    return (
      <div className="card animate-fade-in p-8 text-center">
        <div className="text-5xl">{allCleared ? "🏆" : "🎉"}</div>
        <h2 className="mt-4 text-xl font-bold">
          {allCleared ? "全部刷完啦！" : "本轮完成!"}
        </h2>
        {allCleared ? (
          <p className="mt-2 text-sm text-slate-500">
            当前筛选条件下的题目已被你全部刷过，太强了 👏
          </p>
        ) : (
          filterOn &&
          rem >= 0 && (
            <p className="mt-2 text-sm text-slate-500">
              剩余未刷 <span className="font-bold text-brand-600 dark:text-brand-300">{rem}</span> 题，继续加油！
            </p>
          )
        )}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <ResultStat label="作答" value={done} />
          <ResultStat label="正确" value={correct} accent="green" />
          <ResultStat label="正确率" value={`${rate}%`} accent={rate >= 60 ? "green" : "red"} />
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={restart} className="btn-primary">
            {allCleared ? "返回配置" : "继续刷题"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- 配置页 ----------
  if (!started) {
    const rem = remainingCount();
    return (
      <div className="card animate-fade-in p-6">
        <h2 className="text-lg font-bold">配置刷题</h2>

        {/* 进度提示 */}
        {userId && totalAnswerable != null && (
          <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm dark:bg-brand-900/20">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">
                {source === "all" && type === "all" ? "全部可判分题" : "当前筛选"}进度
              </span>
              <span className="font-semibold text-brand-600 dark:text-brand-300">
                已刷 {Math.min(seenIds.size, totalAnswerable)} / {totalAnswerable}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900/40">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{
                  width: `${
                    totalAnswerable > 0
                      ? Math.min(100, Math.round((Math.min(seenIds.size, totalAnswerable) / totalAnswerable) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
            {skipSeen && rem >= 0 && (
              <div className="mt-1.5 text-xs text-slate-500">还剩 {rem} 题未刷</div>
            )}
          </div>
        )}

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

          {/* 跳过已刷过的题 开关 */}
          {userId && (
            <Field label="做过的题不再出现">
              <button
                onClick={() => setSkipSeen((v) => !v)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                  skipSeen
                    ? "border-brand-400 bg-brand-50 dark:bg-brand-900/30"
                    : "border-slate-200 dark:border-slate-600"
                }`}
              >
                <span className="text-left">
                  <span className="block font-medium text-slate-700 dark:text-slate-200">
                    跳过已刷过的题
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    已答过的题（含错题、收藏、已会）都不再出现，帮你逐步刷完整个题库
                  </span>
                </span>
                <span
                  className={`relative ml-3 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    skipSeen ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      skipSeen ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>
            </Field>
          )}

          {!userId && (
            <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              提示:未登录也可刷题,但答题记录不会被保存,「做过的题不再出现」功能也需登录后才生效。
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
