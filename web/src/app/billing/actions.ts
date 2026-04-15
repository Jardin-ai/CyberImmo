"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface CheckinResult {
  success: boolean;
  balance?: number;
  message?: string;
}

export async function dailyCheckinAction(): Promise<CheckinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("daily_checkin", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Checkin RPC error:", error);
    return { success: false, message: error.message };
  }

  const result = data as CheckinResult;

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/billing");
  }

  return result;
}
