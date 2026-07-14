import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StarField from "@/components/portal/StarField";
import Astronaut from "@/components/portal/Astronaut";
import Reveal from "@/components/portal/Reveal";
import TiltCard from "@/components/portal/TiltCard";
import CursorGlow from "@/components/portal/CursorGlow";
import ScrollProgress from "@/components/portal/ScrollProgress";

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

  // 逐字浮现标题
  const titleWords = ["探索", "我的", "数字", "项目", "空间"];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      {/* 背景层 */}
      <StarField />
      <Astronaut />
      <div className="aurora" />
      <div className="blob left-[-10%] top-[-5%] h-[420px] w-[420px] bg-blue-600/40" />
      <div
        className="blob right-[-8%] top-[10%] h-[380px] w-[380px] bg-fuchsia-600/40"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="blob bottom-[-10%] left-[30%] h-[360px] w-[360px] bg-cyan-500/30"
        style={{ animationDelay: "-9s" }}
      />

      {/* 交互特效层 */}
      <CursorGlow />
      <ScrollProgress />

      {/* 顶部导航 */}
      <header className="relative z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="float-slow grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500 font-black text-white shadow-lg shadow-blue-500/40">
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
              className="shine rounded-full bg-white/10 px-4 py-1.5 font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              进入刷题 →
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
        <div className="grid-floor pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[420px] -translate-y-1/4" />

        <span className="pulse-ring mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-slate-300 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          在线运行中 · 已上线 {total.toLocaleString()} 道题
        </span>

        <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight sm:text-7xl">
          {titleWords.map((w, i) => (
            <span
              key={i}
              className={`rise-word ${i >= 2 ? "hero-title" : ""}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              {w}
            </span>
          ))}
        </h1>

        <p
          className="rise-word mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
          style={{ animationDelay: "0.7s" }}
        >
          这里汇集了我构建的各类应用与工具。目前上线的是一个功能完整的
          <span className="text-slate-200"> 社区工作者考试刷题平台</span>
          ，集刷题、错题本、AI 智能解析于一体。
        </p>

        <div
          className="rise-word mt-10 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "0.85s" }}
        >
          <Link
            href="/shuati"
            className="glow-btn shine group relative overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-8 py-3.5 text-sm font-semibold text-white transition hover:scale-105"
          >
            <span className="relative z-10">🚀 立即开始刷题</span>
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
          <p className="text-slate-400">悬停卡片体验 3D 交互 · 点击进入应用</p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 刷题项目 - 真实 */}
          <Reveal delay={0}>
            <TiltCard>
              <Link
                href="/shuati"
                className="spin-border shine group relative block h-full overflow-hidden rounded-3xl bg-white/[0.04] p-7 backdrop-blur transition duration-300 hover:bg-white/[0.07]"
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
            </TiltCard>
          </Reveal>

          {/* 安卓远程控制 - 真实（可下载 APK） */}
          <Reveal delay={120}>
            <TiltCard>
              <div className="spin-border shine group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white/[0.04] p-7 backdrop-blur transition duration-300 hover:bg-white/[0.07]">
                <div className="absolute right-5 top-5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                  ● 可下载
                </div>
                <div className="float-slow mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 text-4xl ring-1 ring-white/10">
                  📱
                </div>
                <h3 className="text-xl font-bold text-white">安卓远程控制</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  基于 WebSocket 的 Android 远程控制应用，一台手机通过 WiFi 实时查看并操控另一台——
                  屏幕共享、远程触控、小圆点导航。
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["屏幕共享", "远程触控", "小圆点导航", "APK"].map((t) => (
                    <span key={t} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
                  <Link
                    href="/remote-control"
                    className="font-medium text-slate-300 transition hover:text-white"
                  >
                    查看介绍 →
                  </Link>
                  <a
                    href="/RemoteControl.apk"
                    download
                    className="rounded-full bg-emerald-500/90 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-400"
                  >
                    ↓ 下载 APK
                  </a>
                </div>
              </div>
            </TiltCard>
          </Reveal>

          {/* 占位项目 2 */}
          <Reveal delay={240}>
            <TiltCard max={8}>
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
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* 关于 / 技术栈 */}
      <section id="about" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <Reveal className="spin-border overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-8 backdrop-blur sm:p-12">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="leading-relaxed text-slate-400">
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
              ].map((t) => (
                <span
                  key={t}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur transition hover:-translate-y-1 hover:border-blue-400/40 hover:text-white"
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
      <div className="hero-title text-2xl font-black sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}
