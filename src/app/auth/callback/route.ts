import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  // Sanitize redirect: only allow relative paths starting with /
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // Handle OAuth provider errors (e.g. user denied consent)
  if (errorParam) {
    const msg = errorDescription || errorParam;
    console.error("[Auth Callback] OAuth error:", msg);
    return NextResponse.redirect(`${origin}/giris?error=auth`);
  }

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Get user info and ensure profile exists (for OAuth users)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("user_id", user.id)
            .single();

          // If no profile, create one from Google user metadata
          if (!existingProfile) {
            const meta = user.user_metadata || {};
            const fullName = (meta.full_name || meta.name || "").trim();
            const nameParts = fullName.split(" ");
            await supabase.from("profiles").upsert({
              user_id: user.id,
              ad: nameParts[0] || "",
              soyad: nameParts.slice(1).join(" ") || "",
              telefon: "",
              role: "user",
            });
          }
        }

        return NextResponse.redirect(`${origin}${next}`);
      }

      console.error("[Auth Callback] Code exchange error:", error.message);
    } catch (err) {
      console.error("[Auth Callback] Unexpected error:", err);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/giris?error=auth`);
}
