import { createClient } from "@/lib/supabase/server";
import BrowseClient from "@/components/BrowseClient";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 取所有来源(去重)
  const { data } = await supabase.from("questions").select("source").limit(5000);
  const sources = Array.from(new Set((data ?? []).map((d) => d.source))).sort();

  return (
    <div className="animate-fade-in">
      <h1 className="mb-4 text-xl font-bold">题库浏览</h1>
      <BrowseClient sources={sources} userId={user?.id ?? null} />
    </div>
  );
}
