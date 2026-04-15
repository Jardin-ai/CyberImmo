import PersonaCard from "@/components/PersonaCard";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardContainer from "./DashboardContainer";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Parallel fetch for better performance
  const [personasResult, userProfileResult] = await Promise.all([
    supabase
      .from("personas")
      .select(
        "id, display_name, relationship_label, questionnaire_data, created_at, chat_logs(created_at)",
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .order("created_at", { foreignTable: "chat_logs", ascending: false })
      .limit(1, { foreignTable: "chat_logs" }),
    supabase
      .from("users")
      .select(
        "display_name, avatar_url, echo_balance, subscription_tier, daily_free_text_used, last_checkin_date",
      )
      .eq("id", user.id)
      .single(),
  ]);

  const personas = personasResult.data;
  const userProfile = userProfileResult.data;

  return (
    <DashboardContainer
      userId={user.id}
      userDisplayName={userProfile?.display_name ?? null}
      userAvatarUrl={userProfile?.avatar_url ?? null}
      echoBalance={userProfile?.echo_balance ?? 0}
      subscriptionTier={userProfile?.subscription_tier ?? "FREE"}
      dailyFreeTextUsed={userProfile?.daily_free_text_used ?? 0}
      lastCheckinDate={userProfile?.last_checkin_date ?? null}
    >
      <div className="p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl font-bold font-serif"
                style={{ color: "var(--accent-gold)" }}
              >
                记忆控制台
              </h1>
              <p className="text-sm text-foreground/60 mt-1">
                在这里可以找回您创建的记忆档案。
              </p>
            </div>

            <Link href="/onboarding">
              <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-accent transition-colors hover:bg-surface/80">
                <Plus className="h-4 w-4" />
                <span>新建记忆档案</span>
              </button>
            </Link>
          </header>

          {personas && personas.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
              {personas.map((persona: any) => {
                const qData = persona.questionnaire_data as Record<
                  string,
                  unknown
                >;
                const lastChat = persona.chat_logs?.[0]?.created_at;
                return (
                  <PersonaCard
                    key={persona.id}
                    id={persona.id}
                    displayName={persona.display_name}
                    relationshipLabel={persona.relationship_label}
                    avatarUrl={qData?.avatarUrl as string | undefined}
                    createdAt={persona.created_at}
                    lastChatAt={lastChat}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-surface/30">
              <p className="text-center text-sm text-foreground/50 mb-4">
                您还没有创建任何记忆档案。
              </p>
              <Link href="/onboarding">
                <button className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90">
                  立即建档
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardContainer>
  );
}
