import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { MyStats } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/stats");

  const { data: statsRows } = await supabase.rpc("my_stats");
  const stats: MyStats = (statsRows?.[0] as MyStats) ?? {
    total_attempts: 0,
    correct_attempts: 0,
    distinct_done: 0,
    wrong_pending: 0,
    fav_count: 0,
  };

  // 题库总量(用于进度百分比)
  const { count: totalQ } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quality", "answerable");

  // 最近 7 天每日答题量
  const { data: recent } = await supabase
    .from("attempts")
    .select("created_at, is_correct")
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString())
    .order("created_at", { ascending: true });

  const byDay = new Map<string, { total: number; correct: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    byDay.set(key, { total: 0, correct: 0 });
  }
  (recent ?? []).forEach((r) => {
    const d = new Date(r.created_at);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    const v = byDay.get(key);
    if (v) {
      v.total += 1;
      if (r.is_correct) v.correct += 1;
    }
  });
  const days = Array.from(byDay.entries());
  const maxDay = Math.max(1, ...days.map(([, v]) => v.total));

  const rate = stats.total_attempts
    ? Math.round((stats.correct_attempts / stats.total_attempts) * 100)
    : 0;
  const coverage = totalQ ? Math.round((stats.distinct_done / totalQ) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <h1 className="mb-4 text-xl font-bold">刷题统计</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="总答题数" value={stats.total_attempts} icon="✍️" />
        <StatCard label="正确率" value={`${rate}%`} icon="🎯" accent={rate >= 60 ? "green" : "red"} />
        <StatCard label="待消灭错题" value={stats.wrong_pending} icon="🔁" accent="red" />
        <StatCard label="收藏题数" value={stats.fav_count} icon="⭐" />
      </div>

      {/* 覆盖进度 */}
      <div className="card mt-4 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">题库覆盖进度</span>
          <span className="text-slate-500">
            已练 {stats.distinct_done} / {totalQ ?? 0} 题（{coverage}%）
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all" style={{ width: `${coverage}%` }} />
        </div>
      </div>

      {/* 近 7 天趋势 */}
      <div className="card mt-4 p-5">
        <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-200">近 7 天答题量</h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
          {days.map(([key, v]) => (
            <div key={key} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs text-slate-400">{v.total || ""}</span>
              <div
                className="w-full rounded-t-md bg-brand-500/80 transition-all"
                style={{ height: `${(v.total / maxDay) * 100}%`, minHeight: v.total ? 4 : 0 }}
                title={`${key}: ${v.total} 题,正确 ${v.correct}`}
              />
              <span className="text-[10px] text-slate-400">{key}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/practice" className="btn-primary">继续刷题</Link>
        <Link href="/wrong" className="btn-ghost">复习错题</Link>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, accent,
}: { label: string; value: string | number; icon: string; accent?: "green" | "red" }) {
  const color =
    accent === "green" ? "text-green-600 dark:text-green-400"
    : accent === "red" ? "text-red-500 dark:text-red-400"
    : "text-slate-800 dark:text-slate-100";
  return (
    <div className="card p-4">
      <div className="text-xl">{icon}</div>
      <div className={`mt-2 text-2xl font-bold ${color}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}
