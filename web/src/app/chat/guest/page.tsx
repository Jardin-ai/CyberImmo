"use client";

import type { UIMessage } from "ai";
import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { getPath } from "@/lib/public-base-path";
import ChatClient from "../[id]/ChatClient";
import type { QuestionnaireData } from "@/lib/types";

const LOCAL_STORAGE_KEY = "cyberimmo_persona_draft";
const GUEST_QUOTA_KEY = "cyberimmo_guest_quota";
const GUEST_MESSAGES_KEY = "cyberimmo_guest_messages";

type GuestReadyState = {
  draft: QuestionnaireData;
  messages: UIMessage[];
  quota: number;
};

export default function GuestChatPage() {
  const router = useRouter();
  const [guest, setGuest] = useState<GuestReadyState | null>(null);

  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedDraft) {
      router.push(getPath("/onboarding"));
      return;
    }
    const savedQuota = localStorage.getItem(GUEST_QUOTA_KEY);
    const savedMessages = localStorage.getItem(GUEST_MESSAGES_KEY);
    const draft = JSON.parse(savedDraft) as QuestionnaireData;
    const quota = savedQuota ? parseInt(savedQuota, 10) : 50;
    const messages = savedMessages
      ? (JSON.parse(savedMessages) as UIMessage[])
      : [];
    startTransition(() => {
      setGuest({ draft, messages, quota });
    });
  }, [router]);

  if (!guest) return null;
  const { draft, messages, quota } = guest;

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
