-- ============================================================
-- AI 一键解析:给 questions 表加缓存字段
-- 在 Supabase 控制台 -> SQL Editor 执行本文件即可
-- ============================================================

-- ai_explanation : AI 生成的解析内容(缓存,首次生成后存起来,之后直接读)
-- ai_explained_at: 生成时间
alter table public.questions
  add column if not exists ai_explanation text,
  add column if not exists ai_explained_at timestamptz;

-- 说明:
-- questions 表已有 RLS 策略 "questions_read_all"(所有人可 select)。
-- 写入缓存由后端 /api/ai-explain 用 service_role key 执行(绕过 RLS),
-- 前端只读,无需额外写策略。
