import Link from "next/link";
import type { Metadata } from "next";
import StarField from "@/components/portal/StarField";
import Reveal from "@/components/portal/Reveal";
import CursorGlow from "@/components/portal/CursorGlow";
import ScrollProgress from "@/components/portal/ScrollProgress";

export const metadata: Metadata = {
  title: "安卓远程控制 · SQTK.site",
  description:
    "基于 WebSocket 的 Android 远程控制应用——一台手机通过 WiFi 实时查看并控制另一台手机，支持屏幕共享、远程触控与小圆点导航。",
};

const FEATURES = [
  {
    icon: "🖥️",
    title: "屏幕共享",
    desc: "MediaProjection + VirtualDisplay 采集画面，JPEG 压缩后经 WebSocket 实时回传，低延迟同步。",
  },
  {
    icon: "👆",
    title: "远程触控",
    desc: "客户端触控坐标归一化，通过 TOUCH_BATCH 协议下发，AccessibilityService 注入真实手势。",
  },
  {
    icon: "⚪",
    title: "小圆点导航",
    desc: "点击/滑动/停留手势，控制服务端的返回、主页、最近应用、通知栏、控制中心。",
  },
  {
    icon: "✥",
    title: "拖拽定位",
    desc: "长按 2 秒进入拖拽模式，可将悬浮圆点移动到屏幕任意位置，不遮挡操作。",
  },
  {
    icon: "🕘",
    title: "连接历史",
    desc: "基于 SharedPreferences 自动保存最近 10 条连接记录，再次连接一键选择。",
  },
  {
    icon: "🌌",
    title: "沉浸模式",
    desc: "客户端全屏显示远端画面并隐藏系统导航栏，最大化可视区域，专注操控。",
  },
];

const DOT_GESTURES = [
  { g: "点击", e: "返回" },
  { g: "按住 ↑ 上滑", e: "主页" },
  { g: "按住 ↑ 上滑 + 停留 0.3s", e: "最近应用" },
  { g: "按住 ↓ 下滑", e: "通知栏" },
  { g: "按住 ↓ 下滑 + 停留 0.3s", e: "控制中心" },
  { g: "长按 2s", e: "拖拽移动圆点" },
];

const TECH = [
  { k: "通信", v: "java-websocket 1.5.3" },
  { k: "屏幕采集", v: "MediaProjection + VirtualDisplay + ImageReader (RGBA_8888)" },
  { k: "JPEG 压缩", v: "Android Bitmap API，quality = 50" },
  { k: "手势注入", v: "AccessibilityService dispatchGesture + performGlobalAction" },
  { k: "界面", v: "Material Design Components + 自定义 GestureDotView（Canvas 水滴动画）" },
  { k: "触摸协议", v: "TOUCH_BATCH:duration;x1,y1;x2,y2;… 归一化坐标" },
];

const SERVER_STEPS = [
  { step: "01", title: "安装并打开", desc: "在被控手机上安装 APK 并打开应用。" },
  { step: "02", title: "开启无障碍", desc: "进入系统设置 → 无障碍，开启 RemoteControl 服务。" },
  { step: "03", title: "启动服务", desc: "输入端口号（默认 8080），点击「启动服务」。" },
  { step: "04", title: "授权投屏", desc: "按提示授予屏幕录制（MediaProjection）权限。" },
];

const CLIENT_STEPS = [
  { step: "01", title: "安装并打开", desc: "在控制手机上安装 APK 并打开应用。" },
  { step: "02", title: "输入地址", desc: "填入服务端显示的 IP 地址与端口号。" },
  { step: "03", title: "点击连接", desc: "点击「连接」，等待画面加载。" },
  { step: "04", title: "开始操控", desc: "画面正常显示后，即可远程实时操控。" },
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
          Android · WiFi 局域网 · 可直接下载
        </span>

        <div className="float-slow mx-auto mb-6 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 text-6xl ring-1 ring-white/10">
          📱
        </div>

        <h1 className="hero-title text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          安卓远程控制
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          基于 WebSocket 的 Android 远程控制应用——一台手机通过 WiFi
          实时查看并控制另一台手机。屏幕共享、远程触控、小圆点导航，一个 APK 全部搞定。
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
          <p className="mt-2 text-slate-400">从屏幕采集到手势注入的完整远程控制链路</p>
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

      {/* 小圆点手势 */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <Reveal className="mb-10 text-center">
          <h2 className="hero-title text-2xl font-bold sm:text-3xl">小圆点手势</h2>
          <p className="mt-2 text-slate-400">悬浮圆点上的手势直接映射到被控端的系统操作</p>
        </Reveal>
        <Reveal className="glass overflow-hidden rounded-2xl">
          <div className="divide-y divide-white/5">
            <div className="grid grid-cols-2 bg-white/[0.04] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>手势</span>
              <span>效果</span>
            </div>
            {DOT_GESTURES.map((row) => (
              <div
                key={row.g}
                className="grid grid-cols-2 items-center px-6 py-4 text-sm transition hover:bg-white/[0.04]"
              >
                <span className="font-medium text-white">{row.g}</span>
                <span className="text-emerald-300">{row.e}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 使用步骤 */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <Reveal className="mb-10 text-center">
          <h2 className="hero-title text-2xl font-bold sm:text-3xl">如何使用</h2>
          <p className="mt-2 text-slate-400">两台手机需处于同一 WiFi 网络</p>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 服务端 */}
          <Reveal>
            <div className="glass h-full rounded-3xl p-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                📲 服务端 · 被控手机
              </div>
              <ol className="space-y-4">
                {SERVER_STEPS.map((s) => (
                  <li key={s.step} className="flex gap-4">
                    <span className="hero-title shrink-0 text-2xl font-black">{s.step}</span>
                    <div>
                      <h4 className="font-semibold text-white">{s.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          {/* 客户端 */}
          <Reveal delay={120}>
            <div className="glass h-full rounded-3xl p-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-4 py-1.5 text-sm font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
                🎮 客户端 · 控制手机
              </div>
              <ol className="space-y-4">
                {CLIENT_STEPS.map((s) => (
                  <li key={s.step} className="flex gap-4">
                    <span className="hero-title shrink-0 text-2xl font-black">{s.step}</span>
                    <div>
                      <h4 className="font-semibold text-white">{s.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 技术栈 */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <Reveal className="mb-10 text-center">
          <h2 className="hero-title text-2xl font-bold sm:text-3xl">技术栈</h2>
          <p className="mt-2 text-slate-400">原生 Android 实现，无第三方后台服务器</p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {TECH.map((t, i) => (
            <Reveal key={t.k} delay={i * 60}>
              <div className="glass flex h-full flex-col gap-1.5 rounded-2xl p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  {t.k}
                </span>
                <span className="text-sm leading-relaxed text-slate-300">{t.v}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 兼容性提示 */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <Reveal className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-6">
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm leading-relaxed text-amber-200/90">
              部分华为 / 荣耀设备（EMUI）存在无障碍手势注入的兼容性问题：小圆点导航可正常使用，
              但屏幕触控可能需要额外适配。其他主流机型体验正常。
            </p>
          </div>
        </Reveal>
      </section>

      {/* 安装提示 */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <Reveal className="spin-border overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-8 backdrop-blur sm:p-10">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">准备好了吗？</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                下载 APK 后，如系统提示「未知来源」，请在设置中允许安装。两台设备安装同一个 APK 即可，
                仅供学习与个人使用。
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
