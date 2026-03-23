"use client";

import { useState, useEffect, useCallback } from "react";
import { Crown, Users, Plus, Search, RefreshCw, Ban, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { PremiumMembership, Profile } from "@/types";

interface PremiumWithProfile extends PremiumMembership {
  profile?: Pick<Profile, "ad" | "soyad" | "telefon">;
  email?: string;
}

export default function AdminPremiumPage() {
  const [memberships, setMemberships] = useState<PremiumWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantNotes, setGrantNotes] = useState("");
  const [granting, setGranting] = useState(false);

  const loadMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_premium_memberships")
        .select("*, profile:profiles(ad, soyad, telefon)")
        .order("created_at", { ascending: false });

      if (data) {
        // Email bilgisini auth'tan alamayız client-side, profil adı kullanacağız
        setMemberships(data as PremiumWithProfile[]);
      }
    } catch {
      // hata
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const handleGrant = async () => {
    if (!grantEmail.trim()) return;
    setGranting(true);
    try {
      const res = await fetch("/api/premium/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: grantEmail.trim(), notes: grantNotes.trim() }),
      });
      if (res.ok) {
        setShowGrantModal(false);
        setGrantEmail("");
        setGrantNotes("");
        loadMemberships();
      }
    } catch {
      // hata
    } finally {
      setGranting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Bu premium üyeliği iptal etmek istediğinize emin misiniz?")) return;
    try {
      const supabase = createClient();
      await supabase
        .from("user_premium_memberships")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", id);
      loadMemberships();
    } catch {
      // hata
    }
  };

  const filtered = memberships.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${m.profile?.ad || ""} ${m.profile?.soyad || ""}`.toLowerCase();
    return name.includes(q) || m.user_id.includes(q) || m.payment_method.includes(q);
  });

  const stats = {
    active: memberships.filter((m) => m.status === "active").length,
    total: memberships.length,
    revenue: memberships.reduce((s, m) => s + (m.price_paid || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-dark-900 dark:text-dark-50">
            <Crown className="text-amber-500" size={24} />
            Premium Üyelik Yönetimi
          </h1>
          <p className="mt-1 text-sm text-dark-500">Premium üyelikleri görüntüle ve yönet</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadMemberships}
            className="flex items-center gap-1.5 rounded-lg border border-dark-200 px-3 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50 dark:border-dark-600 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            <RefreshCw size={14} /> Yenile
          </button>
          <button
            onClick={() => setShowGrantModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"
          >
            <Plus size={14} /> Premium Ata
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-dark-100 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-xs text-dark-500">Aktif Üye</p>
          <p className="text-2xl font-bold text-amber-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-dark-100 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-xs text-dark-500">Toplam Üyelik</p>
          <p className="text-2xl font-bold text-dark-900 dark:text-dark-50">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-dark-100 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
          <p className="text-xs text-dark-500">Toplam Gelir</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(stats.revenue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="İsim veya ID ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-dark-200 bg-white py-2.5 pl-9 pr-4 text-sm dark:border-dark-600 dark:bg-dark-800 dark:text-dark-50"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-dark-100 dark:border-dark-700">
        <table className="w-full text-sm">
          <thead className="bg-dark-50 dark:bg-dark-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-dark-500">Üye</th>
              <th className="px-4 py-3 text-left font-medium text-dark-500">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-dark-500">Yöntem</th>
              <th className="px-4 py-3 text-right font-medium text-dark-500">Ödenen</th>
              <th className="px-4 py-3 text-left font-medium text-dark-500">Tarih</th>
              <th className="px-4 py-3 text-right font-medium text-dark-500">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100 bg-white dark:divide-dark-700 dark:bg-dark-900">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-dark-500">Yükleniyor...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-dark-500">
                {memberships.length === 0 ? "Henüz premium üye yok" : "Aramayla eşleşen üye bulunamadı"}
              </td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-dark-50 dark:hover:bg-dark-800">
                  <td className="px-4 py-3">
                    <p className="font-medium text-dark-900 dark:text-dark-50">
                      {m.profile?.ad || "?"} {m.profile?.soyad || ""}
                    </p>
                    <p className="text-xs text-dark-400">{m.user_id.slice(0, 8)}...</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === "active" ? "bg-green-100 text-green-700" :
                      m.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-dark-100 text-dark-600"
                    }`}>
                      {m.status === "active" ? <CheckCircle2 size={10} /> : <Ban size={10} />}
                      {m.status === "active" ? "Aktif" : m.status === "cancelled" ? "İptal" : "Süresi Doldu"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">
                    {m.payment_method === "with_order" ? "Siparişle" :
                     m.payment_method === "standalone" ? "Harici" : "Admin"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-dark-900 dark:text-dark-50">
                    {formatPrice(m.price_paid)}
                  </td>
                  <td className="px-4 py-3 text-dark-500">
                    {new Date(m.purchased_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.status === "active" && (
                      <button
                        onClick={() => handleCancel(m.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        İptal Et
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Grant Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-dark-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-dark-900 dark:text-dark-50">
              <Crown size={18} className="text-amber-500" /> Manuel Premium Atama
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Kullanıcı E-posta</label>
                <input
                  type="email"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="kullanici@email.com"
                  className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Not (opsiyonel)</label>
                <input
                  type="text"
                  value={grantNotes}
                  onChange={(e) => setGrantNotes(e.target.value)}
                  placeholder="VIP müşteri, hediye vb."
                  className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowGrantModal(false)}
                className="flex-1 rounded-lg border border-dark-200 py-2 text-sm font-medium dark:border-dark-600 dark:text-dark-200"
              >
                İptal
              </button>
              <button
                onClick={handleGrant}
                disabled={granting || !grantEmail.trim()}
                className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {granting ? "Atanıyor..." : "Premium Ata"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
