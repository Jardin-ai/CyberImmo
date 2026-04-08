import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.user_metadata?.privacy_agreed) {
    redirect("/onboarding");
  }

  // Check if user has an active persona
  const { data: personas } = await supabase
    .from("personas")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (personas && personas.length > 0) {
    redirect("/dashboard");
  }

  redirect("/onboarding");
}
