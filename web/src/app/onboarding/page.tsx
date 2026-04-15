import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./client";
import Link from "next/link";
import { getPath } from "@/lib/public-base-path";
import { ArrowLeft } from "lucide-react";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const hasAgreed = user?.user_metadata?.privacy_agreed === true;

  return (
    <div className="min-h-dvh bg-background relative">
      {/* Back button */}
      <Link 
        href={user ? getPath("/dashboard") : getPath("/")}
        className="absolute left-6 top-8 z-30 flex items-center gap-2 text-sm text-foreground/40 transition-colors hover:text-accent"
      >
        <ArrowLeft size={16} />
        <span>返回{user ? "控制台" : "首页"}</span>
      </Link>

      <OnboardingClient initialStep={hasAgreed ? 1 : 0} />
    </div>
  );
}
