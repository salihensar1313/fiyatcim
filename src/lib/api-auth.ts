import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Verify the request is from an authenticated admin user.
 * Returns { isAdmin: true, userId } or a 401/403 NextResponse.
 */
export async function requireAdmin(): Promise<
  | { isAdmin: true; userId: string; response?: never }
  | { isAdmin: false; userId?: never; response: NextResponse }
> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        isAdmin: false,
        response: NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 }),
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return {
        isAdmin: false,
        response: NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 }),
      };
    }

    return { isAdmin: true, userId: user.id };
  } catch {
    return {
      isAdmin: false,
      response: NextResponse.json({ error: "Auth doğrulanamadı." }, { status: 500 }),
    };
  }
}
