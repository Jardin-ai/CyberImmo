import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import Link from "next/link";
import { getPath } from "@/lib/public-base-path";
import { ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(getPath("/auth/login"));
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-dvh bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Back button */}
      <Link 
        href={getPath("/dashboard")}
        className="absolute left-6 top-8 z-30 flex items-center gap-2 text-sm text-foreground/40 transition-colors hover:text-accent"
      >
        <ArrowLeft size={16} />
        <span>返回控制台</span>
      </Link>

      {/* 边缘氛围光 */}
      <div className="pointer-events-none fixed top-0 left-0 w-full h-[200px] bg-gradient-to-b from-[#8C5032]/20 to-transparent blur-[80px]" />
      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        <header className="pt-8 md:pt-4">
          <h1 className="text-3xl font-serif text-accent mb-1" style={{ color: "var(--accent-gold)" }}>个人设置</h1>
          <p className="text-sm text-foreground/60">管理您的账号资料与账单</p>
        </header>

        <SettingsClient user={user} profile={profile} />
      </div>
    </div>
  );
}
