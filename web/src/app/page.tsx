import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPath } from "@/lib/public-base-path";
import HeroSection from "@/components/HeroSection";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HeroSection />;
  }

  if (!user.user_metadata?.privacy_agreed) {
    redirect(getPath("/onboarding"));
  }

  // Check if user has an active persona
  const { data: personas } = await supabase
    .from("personas")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (personas && personas.length > 0) {
    redirect(getPath("/dashboard"));
  }

  redirect(getPath("/onboarding"));
}
