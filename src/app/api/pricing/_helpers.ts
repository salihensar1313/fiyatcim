import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export function jsonOk(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, error: null, meta: meta ?? null });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message, meta: null }, { status });
}

export async function getPricingAdminContext() {
  const authSupabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return { authSupabase, serviceSupabase: null, user: null, isAdmin: false };
  }

  const { data: profile } = await authSupabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role environment");
  }

  const serviceSupabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    authSupabase,
    serviceSupabase,
    user,
    isAdmin: profile?.role === "admin",
  };
}
