"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Question } from "@/types";
import QuestionCard from "./QuestionCard";
import { createClient } from "@/lib/supabase/client";

type Kind = "wrong" | "favorites";

const COPY: Record<Kind, { title: string; empty: string; emptyHint: string; emptyIcon: string }> = {
  wrong: {
    title: "错题本",
    empty: "还没有错题",
    emptyHint: "去刷题吧,做错的题会自动出现在这里",
    emptyIcon: "✅",
  },
  favorites: {
    title: "我的收藏",
    empty: "还没有收藏",
    emptyHint: "在题目卡片右上角点 ☆ 即可收藏",
    emptyIcon: "⭐",
  },
};

export default function QuestionListClient({
  kind,
  userId,
}: {
  kind: Kind;
  userId: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyPending, setOnlyPending] = useState(true); // 错题本:只看未订正

  useEffect(() => {
    async function load() {
      setLoading(true);
      let ids: string[] = [];

      if (kind === "wrong") {
        let q = supabase
          .from("wrong_questions")
          .select("question_id, resolved, wrong_count")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });
        if (onlyPending) q = q.eq("resolved", false);
        const { data } = await q;
        ids = (data ?? []).map((r) => r.question_id);
      } else {
        const { data } = await supabase
          .from("favorites")
          .select("question_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        ids = (data ?? []).map((r) => r.question_id);
      }

      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .in("id", ids);

      // 保持 ids 的顺序
      const map = new Map((qs ?? []).map((q) => [q.id, q as Question]));
      setItems(ids.map((id) => map.get(id)).filter(Boolean) as Question[]);
      setLoading(false);
    }
    load();
  }, [supabase, kind, userId, onlyPending]);

  const copy = COPY[kind];

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{copy.title}</h1>
        {kind === "wrong" && (
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={onlyPending}
              onChange={(e) => setOnlyPending(e.target.checked)}
              className="accent-brand-500"
            />
            只看未订正
          </label>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="text-5xl">{copy.emptyIcon}</div>
          <p className="mt-4 font-medium text-slate-600 dark:text-slate-300">{copy.empty}</p>
          <p className="mt-1 text-sm text-slate-400">{copy.emptyHint}</p>
          <Link href="/practice" className="btn-primary mt-5">去刷题</Link>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">共 {items.length} 道题</p>
          <div className="space-y-4">
            {items.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                userId={userId}
                initialFav={kind === "favorites"}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
