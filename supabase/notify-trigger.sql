-- ============================================================
-- 新用户注册 -> 微信通知  (Server酱)
-- 在 Supabase 控制台 -> SQL Editor 中执行本文件
-- 前置:已执行过 schema.sql
-- ============================================================

-- 1. 启用 pg_net 扩展(Supabase 内置,用于在数据库里发 HTTP 请求)
create extension if not exists pg_net with schema extensions;

-- 2. 把两个配置写进数据库(替换成你自己的值!)
--    NOTIFY_URL    = 你部署后的网站通知接口地址
--    NOTIFY_SECRET = 与 Vercel 环境变量 NOTIFY_SECRET 完全一致的那串随机字符串
--
--    用 vercel.app 域名最稳(不受未备案拦截影响):
--      https://sqtk.vercel.app/api/notify
alter database postgres set "app.notify_url"    = 'https://sqtk.vercel.app/api/notify';
alter database postgres set "app.notify_secret" = '把这里换成你的_NOTIFY_SECRET';

-- 3. 升级 handle_new_user:建 profile 的同时,异步发通知
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_url    text := current_setting('app.notify_url', true);
  v_secret text := current_setting('app.notify_secret', true);
  v_username text := split_part(new.email, '@', 1);
begin
  -- 原有逻辑:建用户 profile
  insert into public.profiles (id, username)
  values (new.id, v_username)
  on conflict (id) do nothing;

  -- 新增:异步推送注册通知(失败也不影响注册)
  if v_url is not null and v_secret is not null then
    perform net.http_post(
      url     := v_url || '?secret=' || v_secret,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object(
        'type',     'new_user',
        'email',    new.email,
        'username', v_username,
        'time',     to_char(now() at time zone 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS')
      )
    );
  end if;

  return new;
end;
$$;

-- 触发器已在 schema.sql 创建,这里无需重复。若想确认,可重新绑定:
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
