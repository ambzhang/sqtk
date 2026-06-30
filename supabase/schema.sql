-- ============================================================
-- 社区刷题网站 数据库 Schema (Supabase / PostgreSQL)
-- 在 Supabase 控制台 -> SQL Editor 中完整执行本文件
-- ============================================================

-- ---------- 1. 题库表 ----------
create table if not exists public.questions (
  id            text primary key,            -- 原始题目 id,如 "【2022】西安社区考试真题_1"
  source        text not null,               -- 题目来源(试卷名)
  seq           integer,                     -- 来源内序号
  number        integer,                     -- 原题号
  type          text not null,               -- single / multi / judge / essay / unknown
  question      text not null,               -- 题干
  options       jsonb not null default '[]', -- 选项数组 ["A. xxx", "B. xxx"]
  answer        text not null default '',     -- 正确答案,如 "D" / "ABCD"
  explanation   text not null default '',     -- 解析
  quality       text not null default 'view_only', -- answerable(可判分) / view_only(仅浏览)
  created_at    timestamptz not null default now()
);

create index if not exists idx_questions_type    on public.questions(type);
create index if not exists idx_questions_source  on public.questions(source);
create index if not exists idx_questions_quality on public.questions(quality);

-- 题库对所有人可读(包括未登录),只读
alter table public.questions enable row level security;
drop policy if exists "questions_read_all" on public.questions;
create policy "questions_read_all" on public.questions
  for select using (true);

-- ---------- 2. 用户资料表(扩展 auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 新用户注册时自动创建 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 3. 答题记录表 ----------
create table if not exists public.attempts (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  question_id  text not null references public.questions(id) on delete cascade,
  user_answer  text not null default '',
  is_correct   boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists idx_attempts_user      on public.attempts(user_id);
create index if not exists idx_attempts_user_q    on public.attempts(user_id, question_id);
create index if not exists idx_attempts_user_time on public.attempts(user_id, created_at desc);

alter table public.attempts enable row level security;
drop policy if exists "attempts_rw_own" on public.attempts;
create policy "attempts_rw_own" on public.attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 4. 错题本表(每用户每题最多一条,记录待消灭的错题) ----------
create table if not exists public.wrong_questions (
  user_id      uuid not null references auth.users(id) on delete cascade,
  question_id  text not null references public.questions(id) on delete cascade,
  wrong_count  integer not null default 1,
  resolved     boolean not null default false, -- 是否已订正(后续答对则为 true)
  updated_at   timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists idx_wrong_user on public.wrong_questions(user_id, resolved);

alter table public.wrong_questions enable row level security;
drop policy if exists "wrong_rw_own" on public.wrong_questions;
create policy "wrong_rw_own" on public.wrong_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 5. 收藏表 ----------
create table if not exists public.favorites (
  user_id      uuid not null references auth.users(id) on delete cascade,
  question_id  text not null references public.questions(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists idx_fav_user on public.favorites(user_id);

alter table public.favorites enable row level security;
drop policy if exists "fav_rw_own" on public.favorites;
create policy "fav_rw_own" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 6. 统计辅助:用户整体统计视图(可选) ----------
-- 通过 RPC 函数返回个人统计,避免前端多次查询
create or replace function public.my_stats()
returns table (
  total_attempts   bigint,
  correct_attempts bigint,
  distinct_done    bigint,
  wrong_pending    bigint,
  fav_count        bigint
)
language sql
security invoker
as $$
  select
    (select count(*) from attempts where user_id = auth.uid()),
    (select count(*) from attempts where user_id = auth.uid() and is_correct),
    (select count(distinct question_id) from attempts where user_id = auth.uid()),
    (select count(*) from wrong_questions where user_id = auth.uid() and not resolved),
    (select count(*) from favorites where user_id = auth.uid());
$$;
