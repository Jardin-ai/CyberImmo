"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatClient from "../[id]/ChatClient";
import type { QuestionnaireData } from "@/lib/types";
import { generateId } from "ai";

const LOCAL_STORAGE_KEY = "cyberimmo_persona_draft";
const GUEST_QUOTA_KEY = "cyberimmo_guest_quota";
const GUEST_MESSAGES_KEY = "cyberimmo_guest_messages";

export default function GuestChatPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<QuestionnaireData | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [quota, setQuota] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
    const savedQuota = localStorage.getItem(GUEST_QUOTA_KEY);
    const savedMessages = localStorage.getItem(GUEST_MESSAGES_KEY);

    if (!savedDraft) {
      router.push("/onboarding");
      return;
    }

    setDraft(JSON.parse(savedDraft));
    if (savedQuota) setQuota(parseInt(savedQuota));
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    setLoading(false);
  }, [router]);

  if (loading || !draft) return null;

  return (
    <ChatClient
      personaId="guest"
      avatarUrl={draft.avatarUrl}
      displayName={draft.deceasedName}
      userId="guest"
      userDisplayName="访客"
      userAvatarUrl={null}
      initialMessages={messages}
      isGuest={true}
      guestQuota={quota}
    />
  );
}
