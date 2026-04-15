import { redirect } from "next/navigation";
import { getPath } from "@/lib/public-base-path";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getPath("/auth/login"));
  }

  // Fetch user subscription info
  const { data: userProfile } = await supabase
    .from("users")
    .select("echo_balance, subscription_tier, subscription_expires_at")
    .eq("id", user.id)
    .single();

  // Fetch billing history (latest 50 entries)
  const { data: transactions } = await supabase
    .from("billing_tokens")
    .select("id, delta, balance_after, event_type, source_ref, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <Suspense>
      <BillingClient
        echoBalance={userProfile?.echo_balance ?? 0}
        subscriptionTier={userProfile?.subscription_tier ?? "FREE"}
        subscriptionExpiresAt={userProfile?.subscription_expires_at ?? null}
        transactions={transactions ?? []}
      />
    </Suspense>
  );
}
