"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSystemPrompt } from "@/lib/prompt-builder";
import { FREE_TOKEN_GRANT } from "@/lib/constants";
import type { QuestionnaireData } from "@/lib/types";

export async function submitOnboarding(
  data: QuestionnaireData
): Promise<{ personaId?: string; error?: string }> {
  // 1. Get current user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "未登录，请先登录" };
  }

  const admin = createAdminClient();

  // 2. Upsert user in public.users
  const { error: userError } = await admin
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        status: "active",
      },
      { onConflict: "id" }
    );

  if (userError) {
    console.error("Failed to upsert user:", userError);
    return { error: "创建用户失败" };
  }

  // 3. Build system prompt from questionnaire
  const systemPrompt = buildSystemPrompt(data);

  // 4. Insert persona
  const { data: persona, error: personaError } = await admin
    .from("personas")
    .insert({
      user_id: user.id,
      display_name: data.deceasedName,
      relationship_label: data.relationship,
      speaking_style: data.speakingStyle || null,
      opening_message: data.openingMessage || null,
      system_prompt: systemPrompt,
      questionnaire_data: data,
      language: "zh-CN",
      status: "active",
    })
    .select("id")
    .single();

  if (personaError || !persona) {
    console.error("Failed to insert persona:", personaError);
    return { error: "创建角色失败" };
  }

  // 5. Grant free tokens (application-level transaction)
  // First update balance
  const { error: balanceError } = await admin
    .from("users")
    .update({
      token_balance: FREE_TOKEN_GRANT,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (balanceError) {
    console.error("Failed to update balance:", balanceError);
    return { error: "赠送额度失败" };
  }

  // Then record in billing ledger
  const { error: billingError } = await admin.from("billing_tokens").insert({
    user_id: user.id,
    persona_id: persona.id,
    delta: FREE_TOKEN_GRANT,
    balance_after: FREE_TOKEN_GRANT,
    event_type: "grant_free",
    source_ref: "onboarding",
  });

  if (billingError) {
    console.error("Failed to insert billing record:", billingError);
    // Non-fatal: balance is already updated, log for reconciliation
  }

  return { personaId: persona.id };
}

export async function agreeAndCheckPrivacyPolicy() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: "未登录" };

  const { error: updateError } = await supabase.auth.updateUser({
    data: { privacy_agreed: true }
  });

  if (updateError) {
    console.error("Failed to update user metadata:", updateError);
    return { error: "更新协议状态失败" };
  }

  // Check if they have personas
  const { data: personas } = await supabase
    .from("personas")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  const hasPersonas = personas && personas.length > 0;

  return { success: true, hasPersonas };
}

import fs from "fs";
import path from "path";

export async function getPrivacyAgreement(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "../docs/CyberImmo用户服务与数据隐私协议.md");
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Failed to read privacy agreement:", error);
    return "Error: 无法加载服务与隐私协议，请稍后再试。";
  }
}
