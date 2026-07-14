import Link from "next/link";
import type { Metadata } from "next";
import StarField from "@/components/portal/StarField";
import Reveal from "@/components/portal/Reveal";
import CursorGlow from "@/components/portal/CursorGlow";
import ScrollProgress from "@/components/portal/ScrollProgress";

export const metadata: Metadata = {
  title: "安卓远程控制 · SQTK.site",
  description:
    "一款轻量的 Android 远程控制应用，支持远程查看与操控设备屏幕、文件传输与实时协助。",
};

const FEATURES = [
  {
    icon: "🖥️",
    title: "远程屏幕操控",
    desc: "实时查看并操作对方 Android 设备屏幕，点按、滑动、输入同步，延迟低。",
  },
  {
    icon: "📁",
    title: "文件双向传输",
    desc: "在两台设备之间快速传输文件、照片、文档，无需数据线。",
  },
  {
    icon: "🤝",
    title: "远程实时协助",
    desc: "为家人或同事远程排查手机问题，手把手协助操作。",
  },
  {
    icon: "🔒",
    title: "连接安全加密",
    desc: "会话采用加密通道传输，连接需授权确认，保护隐私安全。",
  },
  {
    icon: "⚡",
    title: "轻量低占用",
    desc: "安装包仅 6MB 出头，运行占用低，老设备也能流畅使用。",
  },
  {
    icon: "🌐",
    title: "跨网络连接",
    desc: "支持局域网与互联网远程连接，异地也能随时接入。",
  },
];

const STEPS = [
  { step: "01", title: "下载安装", desc: "点击下方按钮下载 APK，在被控与主控设备上分别安装。" },
  { step: "02", title: "授予权限", desc: "首次启动按提示开启无障碍/投屏等必要权限。" },
  { step: "03", title: "建立连接", desc: "被控端生成连接码，主控端输入即可发起连接。" },
  { step: "04", title: "开始控制", desc: "确认授权后即可远程查看与操控，随时断开。" },
];

export default function RemoteControlPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      {/* 背景层 */}
      <StarField />
      <div className="aurora" />
      <div className="blob left-[-10%] top-[-5%] h-[420px] w-[420px] bg-emerald-600/30" />
      <div
        className="blob right-[-8%] top-[10%] h-[380px] w-[380px] bg-cyan-600/30"
        style={{ animationDelay: "-5s" }}
      />
      <CursorGlow />
      <ScrollProgress />

      {/* 顶部导航 */}
      <header className="relative z-20">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500 font-black text-white shadow-lg shadow-blue-500/40">
              S
            </span>
            <span className="text-lg font-bold tracking-wide">
              SQTK<span className="text-blue-400">.site</span>
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
          >
            ← 返回门户
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <div className="grid-floor pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[380px] -translate-y-1/4" />

        <span className="pulse-ring mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-slate-300 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Android · 可直接下载安装
        </span>

        <div className="float-slow mx-auto mb-6 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 text-6xl ring-1 ring-white/10">
          📱
        </div>

        <h1 className="hero-title text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          安卓远程控制
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          随时随地远程查看与操控你的 Android 设备。屏幕实时同步、文件双向传输、
          远程协助——一个 APK 全部搞定。
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/RemoteControl.apk"
            download
            className="glow-btn shine group relative overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white transition hover:scale-105"
          >
            <span className="relative z-10">↓ 下载 RemoteControl.apk</span>
          </a>
          <span className="text-sm text-slate-500">约 6.1 MB · Android 应用</span>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <Reveal className="mb-10 text-center">
          <h2 className="hero-title text-2xl font-bold sm:text-3xl">核心功能</h2>
          <p className="mt-2 text-slate-400">一款应用，覆盖远程控制的完整场景</p>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="glass group h-full rounded-2xl p-6 transition hover:bg-white/[0.06]">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-2xl ring-1 ring-white/10">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 使用步骤 */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <Reveal className="mb-10 text-center">
          <h2 className="hero-title text-2xl font-bold sm:text-3xl">四步开始使用</h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 80}>
              <div className="glass h-full rounded-2xl p-6">
                <div className="hero-title text-3xl font-black">{s.step}</div>
                <h3 className="mt-3 font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 安装提示 */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <Reveal className="spin-border overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-8 backdrop-blur sm:p-10">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">准备好了吗？</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                下载 APK 后，如系统提示「未知来源」，请在设置中允许安装。仅供学习与个人使用。
              </p>
            </div>
            <a
              href="/RemoteControl.apk"
              download
              className="glow-btn shine shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-3 text-sm font-semibold text-white transition hover:scale-105"
            >
              ↓ 立即下载
            </a>
          </div>
        </Reveal>
      </section>

      {/* 页脚 */}
      <footer className="relative z-10 border-t border-white/10 py-10 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} SQTK.site · 项目空间</p>
        <p className="mt-1 text-xs text-slate-600">
          <Link href="/" className="transition hover:text-slate-400">
            返回门户首页
          </Link>
        </p>
      </footer>
    </div>
  );
}
