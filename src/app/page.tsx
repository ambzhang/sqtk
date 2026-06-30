import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getOverview() {
  const supabase = createClient();
  const { count: total } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });
  const { count: answerable } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quality", "answerable");
  const { data: sources } = await supabase
    .from("questions")
    .select("source")
    .limit(2000);
  const sourceCount = new Set((sources ?? []).map((s) => s.source)).size;
  return { total: total ?? 0, answerable: answerable ?? 0, sourceCount };
}

const FEATURES = [
  { href: "/browse", icon: "📚", title: "题库浏览", desc: "按来源、题型筛选,翻阅全部题目" },
  { href: "/practice", icon: "✍️", title: "开始刷题", desc: "顺序 / 随机抽题,即时判分看解析" },
  { href: "/wrong", icon: "🔁", title: "错题本", desc: "自动收集做错的题,反复巩固" },
  { href: "/favorites", icon: "⭐", title: "我的收藏", desc: "收藏重点题目,随时复习" },
  { href: "/stats", icon: "📊", title: "刷题统计", desc: "答题量、正确率、进度一目了然" },
];

export default async function HomePage() {
  let overview = { total: 0, answerable: 0, sourceCount: 0 };
  try {
    overview = await getOverview();
  } catch {
    // 数据库未配置时降级显示
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="card overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white sm:p-10">
        <h1 className="text-2xl font-bold sm:text-3xl">社区工作者考试刷题平台</h1>
        <p className="mt-2 max-w-xl text-brand-50/90">
          真题 · 模拟 · 专项,覆盖单选 / 多选 / 判断 / 简答。即时判分、自动错题本、刷题进度统计,助你高效备考。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/practice" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50">
            🚀 立即刷题
          </Link>
          <Link href="/browse" className="rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
            浏览题库
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
          <Stat label="题目总数" value={overview.total} />
          <Stat label="可判分题" value={overview.answerable} />
          <Stat label="题库来源" value={overview.sourceCount} />
        </div>
      </section>

      {/* 功能入口 */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-2xl">{f.icon}</div>
            <h3 className="mt-3 font-semibold text-slate-800 group-hover:text-brand-600 dark:text-slate-100">
              {f.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold sm:text-3xl">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs text-brand-50/80">{label}</div>
    </div>
  );
}
