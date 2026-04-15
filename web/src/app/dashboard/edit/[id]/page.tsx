import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import OnboardingClient from "@/app/onboarding/client";
import VoiceUploader from "@/components/persona/VoiceUploader";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPersonaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: persona, error } = await supabase
    .from("personas")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !persona) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-background relative overflow-hidden">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="absolute left-6 top-8 z-30 flex items-center gap-2 text-sm text-foreground/40 transition-colors hover:text-accent"
      >
        <ArrowLeft size={16} />
        <span>返回控制台</span>
      </Link>

      <div className="mx-auto max-w-4xl pt-12 text-center">
        <h1 className="text-2xl font-serif text-accent mb-2">修改记忆档案</h1>
        <p className="text-sm text-foreground/50">在这里修改您为 {persona.display_name} 创建的初始信息。</p>
      </div>

      {/* Voice cloning section */}
      <div className="mx-auto max-w-xl px-4 pt-6 pb-2">
        <VoiceUploader personaId={id} existingVoiceId={persona.voice_id} />
      </div>

      <OnboardingClient
        initialStep={1}
        initialData={persona.questionnaire_data}
        personaId={id}
      />
    </div>
  );
}
