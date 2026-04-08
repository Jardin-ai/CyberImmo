import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./client";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const hasAgreed = user?.user_metadata?.privacy_agreed === true;

  return <OnboardingClient initialStep={hasAgreed ? 1 : 0} />;
}
