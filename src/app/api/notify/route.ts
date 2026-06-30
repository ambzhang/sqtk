import { NextRequest, NextResponse } from "next/server";

/**
 * 通知接口:接收 Supabase 触发器(或其他来源)的事件,推送到 Server酱(微信)。
 *
 * 安全:调用时必须带 ?secret=xxx,与环境变量 NOTIFY_SECRET 匹配才放行,
 *       防止接口被陌生人乱调。
 *
 * 环境变量(在 Vercel 配置):
 *   SERVERCHAN_SENDKEY  -> Server酱 的 SendKey(SCT 开头)
 *   NOTIFY_SECRET       -> 自定义的一串随机字符串,用于校验调用来源
 *
 * 调用方式(POST):
 *   POST /api/notify?secret=NOTIFY_SECRET
 *   body: { "type": "new_user", "email": "xxx@xx.com", "username": "xxx", "time": "..." }
 */

export const runtime = "nodejs";

// Server酱推送
async function pushServerChan(title: string, desp: string) {
  const key = process.env.SERVERCHAN_SENDKEY;
  if (!key) {
    console.error("[notify] 缺少 SERVERCHAN_SENDKEY 环境变量");
    return { ok: false, reason: "no_sendkey" };
  }
  const url = `https://sctapi.ftqq.com/${key}.send`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ title, desp }).toString(),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function POST(req: NextRequest) {
  // 1. 校验密钥
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.NOTIFY_SECRET || secret !== process.env.NOTIFY_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 2. 解析事件
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const type = String(body.type || "");

  // 3. 按事件类型组装消息
  let title = "刷题网站通知";
  let desp = "";

  if (type === "new_user") {
    const email = String(body.email || "未知邮箱");
    const username = String(body.username || "新用户");
    const time = String(body.time || new Date().toISOString());
    title = `🎉 新用户注册:${username}`;
    desp = [
      `**有新用户注册了你的刷题网站!**`,
      ``,
      `- 👤 用户名:${username}`,
      `- 📧 邮箱:${email}`,
      `- 🕐 时间:${time}`,
      ``,
      `> 来自 sqtk.site 社区刷题平台`,
    ].join("\n");
  } else {
    // 通用事件:直接把内容透传
    title = String(body.title || "刷题网站通知");
    desp = String(body.desp || JSON.stringify(body, null, 2));
  }

  // 4. 推送
  const result = await pushServerChan(title, desp);
  return NextResponse.json({ ok: result.ok, result });
}

// 方便浏览器测试(GET 也支持,带 secret 即发一条测试消息)
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.NOTIFY_SECRET || secret !== process.env.NOTIFY_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await pushServerChan(
    "✅ 测试通知",
    "这是一条来自刷题网站的测试消息,能收到说明通知配置成功!"
  );
  return NextResponse.json({ ok: result.ok, result });
}
