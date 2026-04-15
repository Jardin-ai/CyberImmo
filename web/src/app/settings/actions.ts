"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateProfile(data: { displayName: string; avatarUrl: string }) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({
      display_name: data.displayName,
      avatar_url: data.avatarUrl,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    console.error("Update profile error:", error);
    return { error: "更新资料失败" };
  }
  
  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) return { error: "Unauthorized" };

  const admin = createAdminClient();
  
  // Deleting user from auth.users via admin client cascades to public.users, personas, chat_logs, etc.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  
  if (error) {
    console.error("Delete account error:", error);
    return { error: "删除账号失败" };
  }

  // Sign out the current session since the account is deleted
  await supabase.auth.signOut();
  
  return { success: true };
}
