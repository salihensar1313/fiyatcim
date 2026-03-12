import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
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
          await supabase.from("profiles").upsert({
            user_id: user.id,
            ad: meta.full_name?.split(" ")[0] || meta.name?.split(" ")[0] || "",
            soyad: meta.full_name?.split(" ").slice(1).join(" ") || meta.name?.split(" ").slice(1).join(" ") || "",
            telefon: "",
            role: "user",
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/giris?error=auth`);
}
