import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatClient from "./ChatClient";
import type { UIMessage } from "@ai-sdk/react";
import { generateId } from "ai";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Parallel fetch for better performance
  const [personaResult, userProfileResult, chatLogsResult] = await Promise.all([
    supabase
      .from("personas")
      .select("display_name, questionnaire_data, system_prompt, opening_message")
      .eq("id", id)
      .single(),
    supabase
      .from("users")
      .select("display_name, avatar_url, echo_balance")
      .eq("id", user.id)
      .single(),
    supabase
      .from("chat_logs")
      .select("id, role, content, created_at")
      .eq("persona_id", id)
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  const persona = personaResult.data;
  const userProfile = userProfileResult.data;
  const chatLogs = chatLogsResult.data || [];

  const qData = persona?.questionnaire_data as Record<string, unknown> | undefined;
  const avatarUrl = qData?.avatarUrl as string | undefined;
  const aiFirstMessage = qData?.aiFirstMessage as string | undefined;

  const initialMessages: UIMessage[] = [];
  if (chatLogs.length === 0 && aiFirstMessage) {
    // No history yet and an opening line is configured — inject it as the first AI message
    initialMessages.push({
      id: generateId(),
      role: "assistant",
      parts: [{ type: "text" as const, text: aiFirstMessage }],
    });
  } else {
    initialMessages.push(
      ...chatLogs.map((log) => ({
        id: log.id || generateId(),
        role: log.role as "user" | "assistant" | "system",
        parts: [{ type: "text" as const, text: log.content }],
      }))
    );
  }

  return (
    <ChatClient
      personaId={id}
      avatarUrl={avatarUrl}
      displayName={persona?.display_name}
      userId={user.id}
      userDisplayName={userProfile?.display_name ?? null}
      userAvatarUrl={userProfile?.avatar_url ?? null}
      initialMessages={initialMessages}
    />
  );
}
