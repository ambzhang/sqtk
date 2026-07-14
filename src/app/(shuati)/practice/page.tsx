import { createClient } from "@/lib/supabase/server";
import PracticeClient from "@/components/PracticeClient";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("questions")
    .select("source")
    .eq("quality", "answerable")
    .limit(5000);
  const sources = Array.from(new Set((data ?? []).map((d) => d.source))).sort();

  return (
    <div className="animate-fade-in">
      <h1 className="mb-4 text-xl font-bold">开始刷题</h1>
      <PracticeClient sources={sources} userId={user?.id ?? null} />
    </div>
  );
}
