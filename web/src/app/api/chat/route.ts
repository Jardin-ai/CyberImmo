import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSystemPrompt } from "@/lib/prompt-builder";
import { streamText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";

export const maxDuration = 30; // 30 seconds

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();
    const personaId = data?.personaId;

    if (!personaId) {
      return new Response("Missing personaId", { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const admin = createAdminClient();
    
    // 1. Fetch persona data
    const { data: persona, error: personaError } = await admin
      .from("personas")
      .select("*")
      .eq("id", personaId)
      .eq("user_id", user.id)
      .single();

    if (personaError || !persona) {
      return new Response("Persona not found", { status: 404 });
    }

    // 2. Build Prompt
    const systemPrompt = buildSystemPrompt(persona.questionnaire_data);

    // 3. Setup Vercel AI SDK with DeepSeek
    // The api key is automatically read from process.env.DEEPSEEK_API_KEY if configured in @ai-sdk/deepseek, 
    // or we pass it safely.
    
    // We attach the system prompt to the streams
    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: systemPrompt,
      messages,
      async onFinish({ text, usage }) {
        const userMessage = messages[messages.length - 1];
        const sessionId = personaId; // Using personaId as session_id for MVP
        
        // Save chat logs
        await admin.from("chat_logs").insert([
          {
            persona_id: personaId,
            user_id: user.id,
            session_id: sessionId,
            role: "user",
            content: userMessage.content,
            token_cost: 0,
          },
          {
            persona_id: personaId,
            user_id: user.id,
            session_id: sessionId,
            role: "assistant",
            content: text,
            token_cost: usage?.totalTokens || 0,
          }
        ]);
        
        // Application-level billing simulation
        if (usage?.totalTokens) {
            // Note: In MVP, we might deduct token_balance here, but skipping direct RPC
            // if we haven't defined a specific sql function. 
            // Real billing requires robust queueing/transactions.
            // Insert billing token log for consumption
            const deduct = usage.totalTokens;
            await admin.from("billing_tokens").insert({
                user_id: user.id,
                persona_id: personaId,
                delta: -deduct,
                balance_after: 0, // Placeholder, real logic would query balance first
                event_type: "consume_chat",
                source_ref: "api_chat"
            });
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
