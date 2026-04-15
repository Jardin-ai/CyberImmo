"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE_NAME = "cyberimmo_admin";

export async function verifyAdminSecret(secret: string): Promise<{ ok: boolean }> {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || secret !== expected) return { ok: false };
  (await cookies()).set(COOKIE_NAME, expected, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 3600,
    path: "/admin",
  });
  return { ok: true };
}

export async function checkAdminSession(): Promise<boolean> {
  const val = (await cookies()).get(COOKIE_NAME)?.value;
  return !!process.env.ADMIN_SECRET && val === process.env.ADMIN_SECRET;
}

export async function lookupUser(email: string) {
  if (!(await checkAdminSession())) return { error: "Unauthorized" };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email, echo_balance, subscription_tier, display_name")
    .eq("email", email.trim().toLowerCase())
    .single();
  if (error || !data) return { error: "用户未找到" };
  return { user: data };
}

export async function adjustBalance(userId: string, delta: number, reason: string) {
  if (!(await checkAdminSession())) return { ok: false, error: "Unauthorized" };
  if (!delta || !reason.trim()) return { ok: false, error: "delta 和 reason 为必填项" };
  const admin = createAdminClient();
  const { error } = await admin.rpc("apply_billing_delta", {
    p_user_id: userId,
    p_persona_id: null,
    p_delta: delta,
    p_event_type: "manual_adjust",
    p_source_ref: `admin: ${reason.trim()}`,
  });
  if (error) return { ok: false, error: error.message };
  const { data } = await admin.from("users").select("echo_balance").eq("id", userId).single();
  return { ok: true, newBalance: data?.echo_balance };
}
