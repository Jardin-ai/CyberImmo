import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch all active personas
  const { data: personas, error } = await supabase
    .from("personas")
    .select("id, display_name, relationship_label, created_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching personas:", error);
  }

  return (
    <main className="min-h-dvh bg-background p-6 md:p-12 text-foreground">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--accent-gold)" }}>记忆控制台</h1>
            <p className="text-sm text-foreground/60 mt-1">
              在这里可以找回您创建的数字依恋。
            </p>
          </div>
          
          <Link href="/onboarding">
            <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-accent transition-colors hover:bg-surface/80">
              <Plus className="h-4 w-4" />
              <span>新建记忆档案</span>
            </button>
          </Link>
        </header>

        {personas && personas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {personas.map((persona) => (
              <Link key={persona.id} href={`/chat/${persona.id}`}>
                <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-accent/40 hover:shadow-lg">
                  {/* Ambient overlay */}
                  <div className="absolute inset-0 bg-gradient-radial from-accent/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  
                  <div className="relative z-10 space-y-2">
                    <h2 className="text-xl font-medium tracking-tight text-foreground/90 group-hover:text-accent transition-colors">
                      {persona.display_name}
                    </h2>
                    <p className="text-sm font-medium tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      {persona.relationship_label}
                    </p>
                  </div>

                  <div className="relative z-10 mt-6 flex items-center justify-between text-xs text-foreground/40">
                    <span>
                      {new Date(persona.created_at).toLocaleDateString()} 建档
                    </span>
                    <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-accent">
                      进入会话 &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-surface/30">
            <p className="text-center text-sm text-foreground/50 mb-4">
              您还没有创建任何记忆档案。
            </p>
            <Link href="/onboarding">
              <button className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90">
                立即建档
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
