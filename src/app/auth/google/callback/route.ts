import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  // Handle OAuth errors (e.g. user denied consent)
  if (errorParam) {
    console.error("[Google Callback] OAuth error:", errorParam);
    return NextResponse.redirect(`${origin}/giris?error=auth`);
  }

  if (!code) {
    console.error("[Google Callback] No authorization code");
    return NextResponse.redirect(`${origin}/giris?error=auth`);
  }

  try {
    // Step 1: Exchange authorization code for tokens with Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.id_token) {
      console.error("[Google Callback] No id_token received:", tokenData.error || "unknown");
      return NextResponse.redirect(`${origin}/giris?error=auth`);
    }

    // Step 2: Use Supabase signInWithIdToken to create session
    const supabase = await createServerSupabaseClient();
    const { data, error: authError } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: tokenData.id_token,
      access_token: tokenData.access_token,
    });

    if (authError) {
      console.error("[Google Callback] Supabase signInWithIdToken error:", authError.message);
      return NextResponse.redirect(`${origin}/giris?error=auth`);
    }

    // Step 3: Ensure user profile exists (same logic as existing auth/callback)
    if (data.user) {
      const meta = data.user.user_metadata || {};
      const fullName = ((meta.full_name || meta.name || "") as string).trim();
      const nameParts = fullName.split(" ");
      const googleAd = nameParts[0] || "";
      const googleSoyad = nameParts.slice(1).join(" ") || "";
      const googleAvatar = (meta.avatar_url || meta.picture || "") as string;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id, ad, soyad, avatar")
        .eq("user_id", data.user.id)
        .single();

      if (!existingProfile) {
        // No profile — create from Google metadata
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          ad: googleAd,
          soyad: googleSoyad,
          telefon: "",
          role: "user",
          avatar: googleAvatar || null,
        });
      } else {
        // Profile exists but some fields empty — update from Google metadata
        const updates: Record<string, string> = {};
        if (!existingProfile.ad && googleAd) updates.ad = googleAd;
        if (!existingProfile.soyad && googleSoyad) updates.soyad = googleSoyad;
        if (!existingProfile.avatar && googleAvatar) updates.avatar = googleAvatar;
        if (Object.keys(updates).length > 0) {
          await supabase.from("profiles").update(updates).eq("user_id", data.user.id);
        }
      }
    }

    // Step 4: Redirect to hesabim with success indicator
    return NextResponse.redirect(`${origin}/hesabim?login=google`);
  } catch (err) {
    console.error("[Google Callback] Unexpected error:", err);
    return NextResponse.redirect(`${origin}/giris?error=auth`);
  }
}
