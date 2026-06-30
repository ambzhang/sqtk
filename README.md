# 社区刷题网站 (sqtk.site)

社区工作者考试在线刷题平台。Next.js 14 + Supabase + Vercel。

## 功能

- 📚 **题库浏览** — 按来源、题型筛选,关键词搜索,分页
- ✍️ **刷题** — 随机抽题 / 顺序刷题,即时判分,解析展示,进度条 + 结算
- 🔁 **错题本** — 做错自动收集,答对自动订正,可只看未订正
- ⭐ **收藏** — 收藏重点题目随时复习
- 📊 **统计** — 答题量、正确率、题库覆盖进度、近 7 天趋势
- 👤 **用户系统** — 邮箱注册登录(Supabase Auth),数据按用户隔离(RLS)
- 🌙 暗色模式 + 移动端响应式

## 题型支持

单选 / 多选 / 判断 / 简答。题库导入时自动分级:
- `answerable` 可判分(进刷题)
- `view_only` 仅浏览(数据残缺的题)

## 本地开发

```bash
npm install
cp .env.example .env.local   # 填入 Supabase URL 和 anon key
npm run dev                  # http://localhost:3000
```

## 部署 & 题库导入

详见 **`部署指南.md`**。核心三步:

1. Supabase 建库(执行 `supabase/schema.sql`)
2. 导入题库:`npm run import:questions`(需 service_role key)
3. Vercel 部署 + 绑定域名 `sqtk.site`(无需备案)

## 目录结构

```
src/
  app/            页面(首页/浏览/刷题/错题/收藏/统计/登录)
  components/     Navbar / QuestionCard / 各页客户端组件
  lib/
    supabase/     客户端、服务端、中间件
    grade.ts      判分逻辑
  types/          类型定义
supabase/schema.sql   数据库表结构
scripts/import-questions.ts  题库导入脚本
```
