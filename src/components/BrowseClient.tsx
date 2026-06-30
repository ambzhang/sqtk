"use client";

import { useEffect, useState, useCallback } from "react";
import type { Question, QuestionType } from "@/types";
import { TYPE_LABELS } from "@/types";
import QuestionCard from "./QuestionCard";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 10;
const TYPES: (QuestionType | "all")[] = ["all", "single", "multi", "judge", "essay", "unknown"];

export default function BrowseClient({
  sources,
  userId,
}: {
  sources: string[];
  userId: string | null;
}) {
  const supabase = createClient();
  const [source, setSource] = useState<string>("all");
  const [type, setType] = useState<QuestionType | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("questions").select("*", { count: "exact" });
    if (source !== "all") query = query.eq("source", source);
    if (type !== "all") query = query.eq("type", type);
    if (keyword.trim()) query = query.ilike("question", `%${keyword.trim()}%`);
    query = query
      .order("source", { ascending: true })
      .order("seq", { ascending: true })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, count } = await query;
    setItems((data ?? []) as Question[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [supabase, source, type, keyword, page]);

  useEffect(() => {
    load();
  }, [load]);

  // 拉取当前用户对这些题的收藏状态
  useEffect(() => {
    if (!userId || items.length === 0) return;
    const ids = items.map((q) => q.id);
    supabase
      .from("favorites")
      .select("question_id")
      .eq("user_id", userId)
      .in("question_id", ids)
      .then(({ data }) => {
        setFavSet(new Set((data ?? []).map((r) => r.question_id)));
      });
  }, [supabase, userId, items]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {/* 筛选区 */}
      <div className="card mb-4 space-y-3 p-4">
        <input
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          placeholder="🔍 搜索题干关键词…"
          className="input"
        />
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setPage(0); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                type === t
                  ? "bg-brand-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {t === "all" ? "全部题型" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(0); }}
          className="input"
        >
          <option value="all">全部来源（{sources.length} 个）</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* 结果统计 */}
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>共 {total} 道题</span>
        <span>第 {page + 1} / {totalPages} 页</span>
      </div>

      {/* 题目列表 */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center text-slate-400">没有符合条件的题目</div>
      ) : (
        <div className="space-y-4">
          {items.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              userId={userId}
              initialFav={favSet.has(q.id)}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="btn-ghost"
        >
          上一页
        </button>
        <span className="px-2 text-sm text-slate-500">{page + 1} / {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1 || loading}
          className="btn-ghost"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
