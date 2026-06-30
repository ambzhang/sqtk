"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "err" | "ok"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // 若关闭邮箱验证则可直接登录;若开启则提示去邮箱确认
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.push(redirect);
          router.refresh();
        } else {
          setMsg({ type: "ok", text: "注册成功!请前往邮箱完成验证后登录。" });
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirect);
        router.refresh();
      }
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "操作失败,请重试";
      setMsg({ type: "err", text: translateError(text) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-sm animate-fade-in">
      <div className="card p-6">
        <h1 className="text-xl font-bold">{mode === "login" ? "登录" : "注册"}</h1>
        <p className="mt-1 text-sm text-slate-500">社区刷题平台 · sqtk.site</p>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-700/50">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setMsg(null); }}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                mode === m
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-300"
                  : "text-slate-500"
              }`}
            >
              {m === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">邮箱</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input" placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">密码(至少 6 位)</label>
            <input
              type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input" placeholder="••••••"
            />
          </div>

          {msg && (
            <div className={`rounded-lg px-3 py-2 text-sm ${
              msg.type === "err"
                ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300"
            }`}>
              {msg.text}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "处理中…" : mode === "login" ? "登录" : "注册"}
          </button>
        </form>
      </div>
    </div>
  );
}

function translateError(text: string): string {
  if (/Invalid login credentials/i.test(text)) return "邮箱或密码错误";
  if (/already registered/i.test(text)) return "该邮箱已注册,请直接登录";
  if (/Password should be/i.test(text)) return "密码至少 6 位";
  if (/Email not confirmed/i.test(text)) return "邮箱尚未验证,请先到邮箱确认";
  return text;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mt-8 text-center text-slate-400">加载中…</div>}>
      <LoginInner />
    </Suspense>
  );
}
