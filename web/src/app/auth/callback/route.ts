import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPath, withPublicBasePath } from "@/lib/public-base-path";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/onboarding";

  const abs = (path: string) => `${origin}${withPublicBasePath(path)}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has any persona — if yes, go to chat; otherwise onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: personas } = await supabase
          .from("personas")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1);

        if (personas && personas.length > 0) {
          return NextResponse.redirect(abs(`/chat/${personas[0].id}`));
        }
      }
      return NextResponse.redirect(abs(getPath(redirect)));
    }
  }

  // Auth error — redirect to login
  return NextResponse.redirect(abs("/auth/login"));
}
