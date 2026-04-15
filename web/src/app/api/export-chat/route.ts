import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch all personas for this user
  const { data: personas } = await admin
    .from("personas")
    .select("id, display_name, relationship_label")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (!personas || personas.length === 0) {
    return new Response("暂无对话记录", { status: 200 });
  }

  const lines: string[] = [
    "CyberImmo 对话记录导出",
    `导出时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
    "=".repeat(60),
    "",
  ];

  for (const persona of personas) {
    lines.push(`【${persona.display_name ?? "未命名"}】（${persona.relationship_label ?? ""}）`);
    lines.push("-".repeat(40));

    const { data: logs } = await admin
      .from("chat_logs")
      .select("role, content, created_at")
      .eq("persona_id", persona.id)
      .order("created_at", { ascending: true });

    if (!logs || logs.length === 0) {
      lines.push("（暂无对话记录）");
    } else {
      for (const log of logs) {
        const ts = new Date(log.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
        const speaker = log.role === "user" ? "我" : persona.display_name ?? "TA";
        lines.push(`[${ts}] ${speaker}:`);
        lines.push(log.content);
        lines.push("");
      }
    }

    lines.push("");
    lines.push("=".repeat(60));
    lines.push("");
  }

  const content = lines.join("\n");
  const today = new Date().toISOString().split("T")[0];

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="cyberimmo-${today}.txt"`,
    },
  });
}
