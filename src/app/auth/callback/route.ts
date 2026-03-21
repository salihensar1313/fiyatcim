import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

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
    logger.error("auth_oauth_error", { fn: "GET", error: msg });
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
          const meta = user.user_metadata || {};
          const fullName = (meta.full_name || meta.name || "").trim();
          const nameParts = fullName.split(" ");
          const googleAd = nameParts[0] || "";
          const googleSoyad = nameParts.slice(1).join(" ") || "";
          const googleAvatar = (meta.avatar_url || meta.picture || "") as string;

          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("user_id, ad, soyad, avatar")
            .eq("user_id", user.id)
            .single();

          if (!existingProfile) {
            // No profile — create from Google metadata
            await supabase.from("profiles").insert({
              user_id: user.id,
              ad: googleAd,
              soyad: googleSoyad,
              telefon: "",
              role: "user",
              avatar: googleAvatar || null,
            });
          } else {
            // Profile exists but ad/soyad empty — update from Google metadata
            const updates: Record<string, string> = {};
            if (!existingProfile.ad && googleAd) updates.ad = googleAd;
            if (!existingProfile.soyad && googleSoyad) updates.soyad = googleSoyad;
            if (!existingProfile.avatar && googleAvatar) updates.avatar = googleAvatar;
            if (Object.keys(updates).length > 0) {
              await supabase.from("profiles").update(updates).eq("user_id", user.id);
            }
          }
        }

        return NextResponse.redirect(`${origin}${next}`);
      }

      logger.error("auth_code_exchange_failed", { fn: "GET", error: error.message });
    } catch (err) {
      logger.error("auth_callback_unexpected", { fn: "GET", error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/giris?error=auth`);
}
