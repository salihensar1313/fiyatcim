import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    // 1. Tüm kullanıcıları çek (fake reviewer'ları hariç tut)
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const allUsers = authData?.users?.filter(
      (u) => u.email && !u.email.includes("@fiyatcim-fake.local")
    ) || [];

    // 2. Profiller
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, ad, soyad, telefon, role, avatar, is_premium, premium_expires_at");

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    // 3. Siparişler (özet)
    const { data: orders } = await supabase
      .from("orders")
      .select("user_id, total, status, created_at")
      .order("created_at", { ascending: false });

    const orderMap = new Map<string, { count: number; totalSpent: number; lastOrder: string }>();
    for (const o of orders || []) {
      const existing = orderMap.get(o.user_id) || { count: 0, totalSpent: 0, lastOrder: "" };
      existing.count++;
      existing.totalSpent += Number(o.total) || 0;
      if (!existing.lastOrder) existing.lastOrder = o.created_at;
      orderMap.set(o.user_id, existing);
    }

    // 4. Newsletter aboneleri
    const { data: newsletter } = await supabase
      .from("newsletter_subscribers")
      .select("email, is_active, source");

    const newsletterMap = new Map((newsletter || []).map((n) => [n.email, n]));

    // 5. Premium üyelikler
    const { data: premiums } = await supabase
      .from("user_premium_memberships")
      .select("user_id, status, payment_method, purchased_at")
      .eq("status", "active");

    const premiumMap = new Map((premiums || []).map((p) => [p.user_id, p]));

    // Birleştir
    const customers = allUsers.map((u) => {
      const profile = profileMap.get(u.id);
      const orderInfo = orderMap.get(u.id);
      const news = newsletterMap.get(u.email!);
      const premium = premiumMap.get(u.id);

      return {
        id: u.id,
        email: u.email,
        ad: profile?.ad || "",
        soyad: profile?.soyad || "",
        telefon: profile?.telefon || "",
        avatar: profile?.avatar || null,
        role: profile?.role || "user",
        isPremium: profile?.is_premium === true,
        premiumExpires: profile?.premium_expires_at || null,
        premiumMethod: premium?.payment_method || null,
        premiumDate: premium?.purchased_at || null,
        provider: u.app_metadata?.provider || "email",
        orderCount: orderInfo?.count || 0,
        totalSpent: orderInfo?.totalSpent || 0,
        lastOrder: orderInfo?.lastOrder || null,
        newsletterActive: news?.is_active === true,
        newsletterSource: news?.source || null,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at || null,
      };
    });

    // Son giriş tarihine göre sırala
    customers.sort((a, b) => {
      const da = a.lastSignIn || a.createdAt || "";
      const db = b.lastSignIn || b.createdAt || "";
      return db.localeCompare(da);
    });

    return NextResponse.json({ customers, total: customers.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
