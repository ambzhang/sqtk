import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuestionListClient from "@/components/QuestionListClient";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/favorites");
  return <QuestionListClient kind="favorites" userId={user.id} />;
}
