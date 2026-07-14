import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StarField from "@/components/portal/StarField";
import Reveal from "@/components/portal/Reveal";

export const dynamic = "force-dynamic";

async function getShuatiStats() {
  try {
    const supabase = createClient();
    const { count: total } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true });
    const { count: answerable } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("quality", "answerable");
    return { total: total ?? 0, answerable: answerable ?? 0 };
  } catch {
    return { total: 0, answerable: 0 };
  }
}

export default async function PortalHome() {
  const { total, answerable } = await getShuatiStats();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      {/* 背景层 */}
      <StarField />
      <div className="blob left-[-10%] top-[-5%] h-[420px] w-[420px] bg-blue-600/40" />
      <div
        className="blob right-[-8%] top-[10%] h-[380px] w-[380px] bg-fuchsia-600/40"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="blob bottom-[-10%] left-[30%] h-[360px] w-[360px] bg-cyan-500/30"
        style={{ animationDelay: "-9s" }}
      />

      {/* 顶部导航 */}
      <header className="relative z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500 font-black text-white shadow-lg shadow-blue-500/30">
              S
            </span>
            <span className="text-lg font-bold tracking-wide">
              SQTK<span className="text-blue-400">.site</span>
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <a href="#projects" className="hidden transition hover:text-white sm:inline">
              项目
            </a>
            <a href="#about" className="hidden transition hover:text-white sm:inline">
              关于
            </a>
            <Link
              href="/shuati"
              className="rounded-full bg-white/10 px-4 py-1.5 font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              进入刷题 →
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
        <div className="grid-floor pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[420px] -translate-y-1/4" />

        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-slate-300 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          在线运行中 · 已上线 {total.toLocaleString()} 道题
        </span>

        <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          探索我的
          <span className="neon-text"> 数字项目空间</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
          这里汇集了我构建的各类应用与工具。目前上线的是一个功能完整的
          <span className="text-slate-200"> 社区工作者考试刷题平台</span>
          ，集刷题、错题本、AI 智能解析于一体。
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/shuati"
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-fuchsia-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-500/30 transition hover:scale-105"
          >
            <span className="relative z-10">🚀 立即开始刷题</span>
            <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
          </Link>
          <a
            href="#projects"
            className="rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            查看全部项目
          </a>
        </div>

        {/* 滚动提示 */}
        <div className="mt-20 flex flex-col items-center gap-1 text-slate-500">
          <span className="text-xs">向下滚动</span>
          <svg className="scroll-hint h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* 项目集合 */}
      <section id="projects" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">项目集合</h2>
          <p className="mt-3 text-slate-400">点击卡片进入对应应用</p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 刷题项目 - 真实 */}
          <Reveal delay={0}>
            <Link
              href="/shuati"
              className="beam-border group relative block h-full overflow-hidden rounded-3xl bg-white/[0.04] p-7 backdrop-blur transition duration-300 hover:-translate-y-2 hover:bg-white/[0.07]"
            >
              <div className="absolute right-5 top-5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                ● 运行中
              </div>
              <div className="float-slow mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-fuchsia-500/30 text-4xl ring-1 ring-white/10">
                📚
              </div>
              <h3 className="text-xl font-bold text-white">社区刷题平台</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                社区工作者考试题库，支持顺序 / 随机刷题、即时判分、错题本、收藏、刷题统计，
                并集成 AI 一键智能解析。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["刷题", "错题本", "AI 解析", "统计"].map((t) => (
                  <span key={t} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-slate-400">
                  {answerable.toLocaleString()} 题可判分 / 共 {total.toLocaleString()} 题
                </span>
                <span className="font-medium text-blue-400 transition group-hover:translate-x-1">
                  进入 →
                </span>
              </div>
            </Link>
          </Reveal>

          {/* 占位项目 1 */}
          <Reveal delay={120}>
            <div className="glass group relative flex h-full flex-col rounded-3xl p-7 transition hover:bg-white/[0.06]">
              <div className="absolute right-5 top-5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400 ring-1 ring-white/10">
                敬请期待
              </div>
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-4xl opacity-60 ring-1 ring-white/10">
                🧰
              </div>
              <h3 className="text-xl font-bold text-slate-300">效率工具箱</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                一站式在线小工具集合：格式转换、编码解码、时间戳、JSON 美化等，规划中。
              </p>
              <div className="mt-auto pt-6 text-sm text-slate-600">开发中 · Coming soon</div>
            </div>
          </Reveal>

          {/* 占位项目 2 */}
          <Reveal delay={240}>
            <div className="glass group relative flex h-full flex-col rounded-3xl p-7 transition hover:bg-white/[0.06]">
              <div className="absolute right-5 top-5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400 ring-1 ring-white/10">
                敬请期待
              </div>
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-4xl opacity-60 ring-1 ring-white/10">
                ✍️
              </div>
              <h3 className="text-xl font-bold text-slate-300">个人博客</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                记录技术笔记与思考的空间，支持 Markdown 写作与标签归档，规划中。
              </p>
              <div className="mt-auto pt-6 text-sm text-slate-600">开发中 · Coming soon</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 关于 / 技术栈 */}
      <section id="about" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <Reveal className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-8 backdrop-blur sm:p-12">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold">关于这个空间</h2>
              <p className="mt-4 leading-relaxed text-slate-400">
                SQTK.site 是我个人的项目门户，用来承载各类自建应用。所有项目均采用现代化前端技术栈，
                部署于全球 CDN 边缘网络，追求流畅、快速与优雅的体验。
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6">
                <Metric value={total.toLocaleString()} label="题库总量" />
                <Metric value="AI" label="智能解析" />
                <Metric value="24/7" label="在线服务" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                "Next.js 14",
                "React",
                "TypeScript",
                "Tailwind CSS",
                "Supabase",
                "PostgreSQL",
                "DeepSeek AI",
                "Vercel",
              ].map((t, i) => (
                <span
                  key={t}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur transition hover:border-blue-400/40 hover:text-white"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 页脚 */}
      <footer className="relative z-10 border-t border-white/10 py-10 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} SQTK.site · 项目空间</p>
        <p className="mt-1 text-xs text-slate-600">Built with Next.js · Powered by Vercel</p>
      </footer>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="neon-text text-2xl font-black sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}
