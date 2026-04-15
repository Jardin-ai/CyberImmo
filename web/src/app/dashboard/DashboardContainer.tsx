"use client";

import { useEffect, useState } from "react";
import MainSidebar from "@/components/MainSidebar";
import { ModelProvider } from "@/lib/model-context";
import { PanelLeft } from "lucide-react";
import { submitOnboarding, syncGuestMessages } from "../onboarding/actions";

interface DashboardContainerProps {
  children: React.ReactNode;
  userId: string;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  echoBalance: number;
  subscriptionTier: string;
  dailyFreeTextUsed: number;
  lastCheckinDate: string | null;
}

export default function DashboardContainer({
  children,
  userId,
  userDisplayName,
  userAvatarUrl,
  echoBalance,
  subscriptionTier,
  dailyFreeTextUsed,
  lastCheckinDate,
}: DashboardContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sync guest data if it exists (idempotent: uses sync_done flag)
  useEffect(() => {
    const sync = async () => {
      const draftStr = localStorage.getItem("cyberimmo_persona_draft");
      if (!draftStr) return;

      // Already synced on a previous mount — just clean up and return
      if (localStorage.getItem("cyberimmo_sync_done") === "1") {
        localStorage.removeItem("cyberimmo_persona_draft");
        localStorage.removeItem("cyberimmo_guest_messages");
        localStorage.removeItem("cyberimmo_guest_quota");
        localStorage.removeItem("cyberimmo_sync_done");
        return;
      }

      try {
        const draft = JSON.parse(draftStr);
        const onboardingResult = await submitOnboarding(draft);
        if (onboardingResult.error) return;

        const personaId = onboardingResult.personaId!;
        const messagesStr = localStorage.getItem("cyberimmo_guest_messages");

        if (messagesStr) {
          try {
            const msgs = JSON.parse(messagesStr);
            if (msgs.length > 0) await syncGuestMessages(personaId, msgs);
          } catch { /* non-fatal */ }
        }

        // Mark done before cleanup to prevent duplicate sync on interrupted reload
        localStorage.setItem("cyberimmo_sync_done", "1");
        localStorage.removeItem("cyberimmo_persona_draft");
        localStorage.removeItem("cyberimmo_guest_messages");
        localStorage.removeItem("cyberimmo_guest_quota");

        window.location.reload();
      } catch { /* preserve draft, retry on next mount */ }
    };
    sync();
  }, []);

  return (
    <ModelProvider>
      <div className="flex h-dvh overflow-hidden bg-background text-foreground">
        <MainSidebar
          userId={userId}
          displayName={userDisplayName}
          avatarUrl={userAvatarUrl}
          initialBalance={echoBalance}
          subscriptionTier={subscriptionTier}
          dailyFreeTextUsed={dailyFreeTextUsed}
          lastCheckinDate={lastCheckinDate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* Header with sidebar toggle */}
          <header className="flex h-14 shrink-0 items-center px-4 border-b border-border bg-surface/30 backdrop-blur-sm md:hidden">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-white/5"
            >
              <PanelLeft size={18} />
            </button>
            <span className="ml-3 text-sm font-medium">控制台</span>
          </header>

          <div className="flex-1 overflow-y-auto">
            {/* Desktop toggle (floating or fixed) */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className={`hidden md:flex fixed left-4 top-4 z-50 h-10 w-10 items-center justify-center rounded-full bg-surface/80 border border-border shadow-lg transition-all hover:bg-accent hover:text-black ${sidebarOpen ? "translate-x-60 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`}
              title="打开侧边栏"
            >
              <PanelLeft size={20} />
            </button>

            {children}
          </div>
        </div>
      </div>
    </ModelProvider>
  );
}
