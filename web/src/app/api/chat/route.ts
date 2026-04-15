import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSystemPrompt } from "@/lib/prompt-builder";
import { SLIDING_WINDOW_SIZE } from "@/lib/constants";
import { streamText, convertToModelMessages, generateId } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { ModelId } from "@/lib/model-context";

// All GLM models via ZhipuAI OpenAI-compatible API
const zhipu = createOpenAI({
  apiKey: process.env.ZHIPU_API_KEY ?? "",
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
});

// Base text cost in "回声" per round — FREE tier only
const MODEL_ECHO_COST: Record<ModelId, number> = {
  "glm-4": 5,
  "glm-4-flash": 0,
};

// Image attachment surcharge — applies to ALL tiers
const IMAGE_ECHO_COST = 50;

function resolveModel(modelId: ModelId, hasImage: boolean): LanguageModel {
  // Auto-upgrade to vision model when image is attached
  if (hasImage) return zhipu.chat("glm-4v-flash");
  return modelId === "glm-4-flash"
    ? zhipu.chat("glm-4-flash")
    : zhipu.chat("glm-4");
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const { messages = [], data } = rawBody;
    const personaId: string | undefined = data?.personaId;
    const modelId: ModelId = data?.modelId ?? "glm-4";
    const isGuest: boolean = data?.isGuest ?? false;

    if (!personaId && !isGuest) {
      return new Response("Missing personaId", { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ── Guest Mode Handling ────────────────────────────────
    if (isGuest) {
      // In guest mode, we don't check auth or persona ownership
      // We use the questionnaire data from the last system-like prompt or client can send it
      // For simplicity, let's assume the client sends the persona draft in 'data'
      const guestPersonaData = data?.personaDraft;
      const systemPrompt = buildSystemPrompt(guestPersonaData || {});
      const model = resolveModel(modelId, false); // Guest can't send images for now
      const windowedMessages = messages.slice(-SLIDING_WINDOW_SIZE);

      const result = streamText({
        model,
        system: systemPrompt,
        messages: await convertToModelMessages(windowedMessages),
      });

      return result.toUIMessageStreamResponse({
        originalMessages: messages,
        generateMessageId: generateId,
      });
    }

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const admin = createAdminClient();

    // ── Step 1: Fetch persona (ownership check) ──────────────
    const { data: persona, error: personaError } = await admin
      .from("personas")
      .select("*")
      .eq("id", personaId)
      .eq("user_id", user.id)
      .single();

    if (personaError || !persona) {
      return new Response("Persona not found", { status: 404 });
    }

    // ── Step 2: Fetch user subscription state ────────────────
    const { data: userData } = await admin
      .from("users")
      .select("subscription_tier, echo_balance, daily_free_text_used, subscription_expires_at")
      .eq("id", user.id)
      .single();

    const subscriptionTier: string = userData?.subscription_tier ?? "FREE";
    const echoBalance: number = userData?.echo_balance ?? 0;
    const dailyFreeTextUsed: number = userData?.daily_free_text_used ?? 0;
    const subscriptionExpiresAt: string | null = userData?.subscription_expires_at ?? null;
    // Treat as FREE if paid subscription has expired
    const effectiveTier =
      subscriptionTier !== "FREE" &&
      subscriptionExpiresAt !== null &&
      new Date(subscriptionExpiresAt) < new Date()
        ? "FREE"
        : subscriptionTier;
    const isFreeTier = effectiveTier === "FREE";

    // ── Step 3: Detect image attachments ────────────────────
    const lastMsg = messages[messages.length - 1];
    const hasImage = !!(
      (lastMsg?.experimental_attachments as unknown[] | undefined)?.length ||
      lastMsg?.parts?.some((p: { type: string }) => p.type === "image")
    );

    // ── Step 4: FUP circuit breaker (FREE + glm-4 only) ─────
    if (isFreeTier && modelId === "glm-4" && dailyFreeTextUsed >= 5) {
      return new Response(
        JSON.stringify({
          error: "QuotaExceeded",
          message:
            "今天的精神波长已趋于微弱，亲人需要休息。明天再来，或者开启【灵犀通讯】以维持稳定的连接。",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Step 5: Echo balance check ───────────────────────────
    // Text cost: FREE tier only; image surcharge: all tiers
    const textCost = isFreeTier ? (MODEL_ECHO_COST[modelId] ?? 5) : 0;
    const imageCost = hasImage ? IMAGE_ECHO_COST : 0;
    const totalCost = textCost + imageCost;

    if (totalCost > 0 && echoBalance < totalCost) {
      return new Response(
        JSON.stringify({
          error: "InsufficientBalance",
          message: hasImage
            ? "图片分析需要额外50回声，当前余额不足。请签到或充值后重试。"
            : "回声余额不足，精神连接无法维持。请签到或充值以继续对话。",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Step 6: Build system prompt & resolve model ──────────
    // Use the stored system_prompt for efficiency; fall back to rebuilding if missing
    const systemPrompt = (persona.system_prompt as string | null)
      ?? buildSystemPrompt(persona.questionnaire_data);
    const model = resolveModel(modelId, hasImage);

    // ── Step 7: Stream response (sliding window for token efficiency) ──
    const windowedMessages = messages.slice(-SLIDING_WINDOW_SIZE);
    const result = streamText({
      model,
      system: systemPrompt,
      messages: await convertToModelMessages(windowedMessages),
      async onFinish({ text }) {
        const sessionId = personaId;
        const userText =
          lastMsg?.parts
            ?.filter((p: { type: string }) => p.type === "text")
            .map((p: { text: string }) => p.text)
            .join("") ??
          (lastMsg as { content?: string })?.content ??
          "";

        // Persist chat logs
        await admin.from("chat_logs").insert([
          {
            persona_id: personaId,
            user_id: user.id,
            session_id: sessionId,
            role: "user",
            content: userText,
            token_cost: 0,
          },
          {
            persona_id: personaId,
            user_id: user.id,
            session_id: sessionId,
            role: "assistant",
            content: text,
            token_cost: totalCost,
          },
        ]);

        // Deduct echoes atomically
        if (totalCost > 0) {
          await admin.rpc("apply_billing_delta", {
            p_user_id: user.id,
            p_persona_id: personaId,
            p_delta: -totalCost,
            p_event_type: "consume_chat",
            p_source_ref: hasImage ? "model:glm-4v-flash" : `model:${modelId}`,
          });
        }

        // Increment daily free text counter atomically for FREE + glm-4
        if (isFreeTier && modelId === "glm-4") {
          await admin.rpc("increment_daily_text_used", { p_user_id: user.id });
        }
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: generateId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
