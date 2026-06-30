import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuestionListClient from "@/components/QuestionListClient";

export const dynamic = "force-dynamic";

export default async function WrongPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/wrong");
  return <QuestionListClient kind="wrong" userId={user.id} />;
}
