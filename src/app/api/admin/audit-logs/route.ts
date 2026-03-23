import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/audit-logs
 *
 * Admin-only audit log okuma endpoint'i.
 * Client-side doğrudan Supabase erişimi yerine bu route kullanılır.
 *
 * GÜVENLIK: Sadece admin rolüne sahip kullanıcılar erişebilir.
 * @see claude2-detailed-security-report-2026-03-23.md — Bulgu #3
 */
export async function GET(request: NextRequest) {
  try {
    // Auth kontrolü — Supabase session'dan user al
    const cookieStore = await cookies();
    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 401 });
    }

    // Admin rolü kontrolü — profiles tablosundan
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 403 });
    }

    // Service role ile audit_logs oku (RLS bypass)
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 200), 500);
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await adminClient
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[audit-logs] Query error:", error.message);
      return NextResponse.json({ error: "Veriler alinamadi." }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[audit-logs] Error:", err);
    return NextResponse.json({ error: "Sunucu hatasi." }, { status: 500 });
  }
}

/**
 * POST /api/admin/audit-logs
 *
 * Admin-only audit log ekleme endpoint'i.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 403 });
    }

    const body = await request.json();
    const { action, entity_type, entity_id, new_value } = body;

    if (!action) {
      return NextResponse.json({ error: "action alani zorunlu." }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      new_value: new_value || null,
    });

    if (error) {
      console.error("[audit-logs] Insert error:", error.message);
      return NextResponse.json({ error: "Kayit eklenemedi." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[audit-logs] Error:", err);
    return NextResponse.json({ error: "Sunucu hatasi." }, { status: 500 });
  }
}
