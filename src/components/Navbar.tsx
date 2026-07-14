"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV = [
  { href: "/shuati", label: "首页" },
  { href: "/browse", label: "题库" },
  { href: "/practice", label: "刷题" },
  { href: "/wrong", label: "错题本" },
  { href: "/favorites", label: "收藏" },
  { href: "/stats", label: "统计" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/shuati");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/shuati" className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-300">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">题</span>
          <span className="hidden sm:inline">社区刷题</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname === n.href
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="切换主题"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {dark ? "🌙" : "☀️"}
          </button>

          {user ? (
            <button onClick={signOut} className="btn-ghost !py-2 hidden sm:inline-flex">
              退出
            </button>
          ) : (
            <Link href="/login" className="btn-primary !py-2 hidden sm:inline-flex">
              登录
            </Link>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="菜单"
          >
            ☰
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-2 md:hidden dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-3 gap-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-center text-sm ${
                  pathname === n.href
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <div className="mt-2">
            {user ? (
              <button onClick={signOut} className="btn-ghost w-full">退出登录</button>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="btn-primary w-full">
                登录 / 注册
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
