"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users, Search, Crown, Mail, ShoppingCart, Phone,
  Filter, ChevronDown, ChevronUp, Send, X, Check,
  Globe, Smartphone, Download,
} from "lucide-react";
import { exportCSV } from "@/lib/csv";
import { useToast } from "@/components/ui/Toast";

interface Customer {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  telefon: string;
  avatar: string | null;
  role: string;
  isPremium: boolean;
  premiumExpires: string | null;
  premiumMethod: string | null;
  premiumDate: string | null;
  provider: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string | null;
  newsletterActive: boolean;
  newsletterSource: string | null;
  createdAt: string;
  lastSignIn: string | null;
}

type FilterType = "all" | "premium" | "non-premium" | "newsletter" | "has-orders" | "no-orders";

function formatPrice(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(n);
}
function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateTime(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminCustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<"date" | "orders" | "spent">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Mail modal
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailSubject, setMailSubject] = useState("");
  const [mailTemplate, setMailTemplate] = useState<"premium-teklif" | "kampanya" | "custom">("premium-teklif");
  const [mailCustomHtml, setMailCustomHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []))
      .catch(() => showToast("Müşteri verisi yüklenemedi", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filtered = useMemo(() => {
    let list = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.email.toLowerCase().includes(q) || c.ad.toLowerCase().includes(q) ||
        c.soyad.toLowerCase().includes(q) || c.telefon.includes(q)
      );
    }
    switch (filter) {
      case "premium": list = list.filter((c) => c.isPremium); break;
      case "non-premium": list = list.filter((c) => !c.isPremium); break;
      case "newsletter": list = list.filter((c) => c.newsletterActive); break;
      case "has-orders": list = list.filter((c) => c.orderCount > 0); break;
      case "no-orders": list = list.filter((c) => c.orderCount === 0); break;
    }
    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortBy === "orders") diff = a.orderCount - b.orderCount;
      else if (sortBy === "spent") diff = a.totalSpent - b.totalSpent;
      else diff = (a.lastSignIn || a.createdAt || "").localeCompare(b.lastSignIn || b.createdAt || "");
      return sortDir === "desc" ? -diff : diff;
    });
  }, [customers, search, filter, sortBy, sortDir]);

  const stats = useMemo(() => ({
    total: customers.length,
    premium: customers.filter((c) => c.isPremium).length,
    newsletter: customers.filter((c) => c.newsletterActive).length,
    withOrders: customers.filter((c) => c.orderCount > 0).length,
  }), [customers]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const selectAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id)));
  const selectByFilter = (type: "non-premium" | "newsletter") => {
    setSelected(new Set(filtered.filter((c) => type === "non-premium" ? !c.isPremium : c.newsletterActive).map((c) => c.id)));
  };

  const getMailHtml = () => {
    if (mailTemplate === "custom") return mailCustomHtml;
    if (mailTemplate === "premium-teklif") {
      return `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)"><div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 24px;text-align:center"><img src="https://fiyatcim.com/images/logo-white.png" alt="Fiyatcim.com" width="300" height="75" style="height:75px;width:300px;max-width:100%;display:block;margin:0 auto;object-fit:contain"/><div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);border-radius:16px;padding:10px 20px;margin-top:16px"><span style="font-size:24px;color:#fff;font-weight:800">👑 Premium'a Geç!</span></div></div><div style="padding:28px 32px"><p style="margin:0 0 16px;font-size:16px;color:#333">Merhaba,</p><p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6">Fiyatcim Premium ile alışverişlerinizde büyük avantajlar elde edin!</p><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:20px"><ul style="color:#78350f;margin:0;padding:0 0 0 16px;font-size:13px;line-height:2.2"><li>🔧 Ücretsiz Profesyonel Kurulum</li><li>🚚 Tüm Siparişlerde Ücretsiz Kargo</li><li>📺 1 Ay Netflix Hediye</li><li>🎵 1 Ay Spotify Premium Hediye</li><li>🛡️ +1 Yıl Uzatılmış Garanti</li><li>📞 7/24 Öncelikli Destek Hattı</li></ul></div><p style="margin:0 0 20px;color:#333;font-size:16px;font-weight:700;text-align:center">Sadece <span style="color:#DC2626;font-size:20px">₺3.000</span></p><a href="https://www.fiyatcim.com/premium" style="display:block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;padding:14px;border-radius:8px;text-align:center;font-weight:700;font-size:16px">Premium'a Geç</a></div><div style="background:#f8f8f8;padding:16px 24px;text-align:center"><p style="margin:0;font-size:11px;color:#888">Bu e-posta Fiyatcim.com tarafından gönderilmiştir.</p></div></div>`;
    }
    return `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)"><div style="background:#DC2626;padding:28px 24px;text-align:center"><img src="https://fiyatcim.com/images/logo-white.png" alt="Fiyatcim.com" width="300" height="75" style="height:75px;width:300px;max-width:100%;display:block;margin:0 auto;object-fit:contain"/><h1 style="margin:12px 0 0;font-size:22px;font-weight:700;color:#fff">Yeni Kampanya!</h1></div><div style="padding:28px 32px"><p style="margin:0 0 16px;font-size:16px;color:#333">Merhaba,</p><p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6">Güvenlik sistemlerinde kaçırılmayacak fırsatlar sizi bekliyor!</p><a href="https://www.fiyatcim.com/kampanyalar" style="display:block;background:#DC2626;color:#fff;text-decoration:none;padding:14px;border-radius:8px;text-align:center;font-weight:700;font-size:16px">Kampanyaları İncele</a></div><div style="background:#f8f8f8;padding:16px 24px;text-align:center"><p style="margin:0;font-size:11px;color:#888">Bu e-posta Fiyatcim.com tarafından gönderilmiştir.</p></div></div>`;
  };

  const handleSendMail = async () => {
    const selectedEmails = filtered.filter((c) => selected.has(c.id)).map((c) => c.email);
    if (!selectedEmails.length || !mailSubject.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/customers/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: selectedEmails, subject: mailSubject, html: getMailHtml() }),
      });
      const data = await res.json();
      setSendResult({ sent: data.sent || 0, failed: data.failed || 0 });
      showToast(`${data.sent} mail gönderildi`, "success");
    } catch {
      setSendResult({ sent: 0, failed: selectedEmails.length });
      showToast("Mail gönderimi başarısız", "error");
    } finally {
      setSending(false);
    }
  };

  const handleExportCSV = () => {
    exportCSV({
      filename: `fiyatcim-musteriler-${new Date().toISOString().slice(0, 10)}.csv`,
      headers: ["Ad", "Soyad", "E-posta", "Telefon", "Premium", "Sipariş", "Harcama", "Newsletter", "Kayıt"],
      rows: filtered.map((c) => [
        c.ad, c.soyad, c.email, c.telefon,
        c.isPremium ? "Evet" : "Hayır",
        String(c.orderCount), formatPrice(c.totalSpent),
        c.newsletterActive ? "Evet" : "Hayır",
        formatDate(c.createdAt),
      ]),
    });
    showToast("CSV indirildi", "success");
  };

  const SortBtn = ({ field, label }: { field: "date" | "orders" | "spent"; label: string }) => (
    <button
      onClick={() => { if (sortBy === field) setSortDir((d) => d === "asc" ? "desc" : "asc"); else { setSortBy(field); setSortDir("desc"); } }}
      className={`flex items-center gap-1 text-xs font-medium ${sortBy === field ? "text-primary-400" : "text-dark-400 hover:text-dark-200"}`}
    >
      {label}
      {sortBy === field && (sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
    </button>
  );

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Müşteriler</h1>
          <p className="text-sm text-dark-400">Kayıtlı kullanıcılar ve detayları</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 rounded-lg border border-dark-600 px-3 py-2 text-xs font-medium text-dark-300 hover:bg-dark-700">
            <Download size={14} /> CSV
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => { setMailSubject(mailTemplate === "premium-teklif" ? "👑 Fiyatcim Premium ile Avantajlı Alışveriş!" : "🔥 Yeni Kampanya — Fiyatcim"); setShowMailModal(true); }}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Send size={14} /> {selected.size} Kişiye Mail
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Toplam", value: stats.total, icon: Users, color: "text-blue-400" },
          { label: "Premium", value: stats.premium, icon: Crown, color: "text-amber-400" },
          { label: "Newsletter", value: stats.newsletter, icon: Mail, color: "text-green-400" },
          { label: "Sipariş Veren", value: stats.withOrders, icon: ShoppingCart, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-dark-700 bg-dark-800 p-4">
            <div className="flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className="text-2xl font-bold text-dark-50">{s.value}</p>
                <p className="text-xs text-dark-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İsim, email veya telefon ara..."
            className="w-full rounded-lg border border-dark-600 bg-dark-700 py-2 pl-9 pr-3 text-sm text-dark-100 placeholder:text-dark-400 focus:border-primary-500 focus:outline-none" />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-dark-400" />
          {(["all", "premium", "non-premium", "newsletter", "has-orders", "no-orders"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === f ? "bg-primary-600 text-white" : "bg-dark-700 text-dark-300 hover:bg-dark-600"}`}>
              {{ all: "Tümü", premium: "Premium", "non-premium": "Non-Premium", newsletter: "Newsletter", "has-orders": "Siparişli", "no-orders": "Siparişsiz" }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Quick select */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-dark-500">Hızlı seç:</span>
        <button onClick={selectAll} className="text-primary-400 hover:underline">{selected.size === filtered.length ? "Seçimi Kaldır" : "Tümünü Seç"}</button>
        <span className="text-dark-600">|</span>
        <button onClick={() => selectByFilter("non-premium")} className="text-amber-400 hover:underline">Non-Premium</button>
        <span className="text-dark-600">|</span>
        <button onClick={() => selectByFilter("newsletter")} className="text-green-400 hover:underline">Newsletter</button>
        {selected.size > 0 && <span className="ml-2 rounded-full bg-primary-600/20 px-2 py-0.5 text-primary-400">{selected.size} seçili</span>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-dark-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700 bg-dark-800">
              <th className="p-3 text-left"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} className="rounded" /></th>
              <th className="p-3 text-left text-xs font-medium text-dark-400">Müşteri</th>
              <th className="hidden p-3 text-left text-xs font-medium text-dark-400 md:table-cell">İletişim</th>
              <th className="p-3 text-center text-xs font-medium text-dark-400">Durum</th>
              <th className="hidden p-3 text-right sm:table-cell"><SortBtn field="orders" label="Sipariş" /></th>
              <th className="hidden p-3 text-right md:table-cell"><SortBtn field="spent" label="Harcama" /></th>
              <th className="p-3 text-right"><SortBtn field="date" label="Son Giriş" /></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td colSpan={7} className="p-0">
                  <div
                    className={`flex cursor-pointer items-center border-b border-dark-700/50 transition-colors hover:bg-dark-800/50 ${selected.has(c.id) ? "bg-primary-900/20" : ""}`}
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <div className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" />
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={c.avatar} alt="" className={`h-8 w-8 rounded-full object-cover ${c.isPremium ? "ring-2 ring-amber-400" : ""}`} />
                        ) : (
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${c.isPremium ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-dark-600"}`}>
                            {(c.ad?.[0] || c.email[0] || "?").toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className={`font-medium ${c.isPremium ? "text-amber-400" : "text-dark-100"}`}>
                            {c.ad} {c.soyad}
                            {c.isPremium && <Crown size={12} className="ml-1 inline text-amber-400" />}
                          </p>
                          <p className="text-xs text-dark-500">{c.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="hidden p-3 md:block">
                      {c.telefon && <p className="flex items-center gap-1 text-xs text-dark-300"><Phone size={10} /> {c.telefon}</p>}
                      <p className="flex items-center gap-1 text-xs text-dark-500">{c.provider === "google" ? <Globe size={10} /> : <Smartphone size={10} />} {c.provider === "google" ? "Google" : "E-posta"}</p>
                    </div>
                    <div className="p-3 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {c.isPremium && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">PREMIUM</span>}
                        {c.newsletterActive && <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">BÜLTEN</span>}
                        {c.role === "admin" && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">ADMIN</span>}
                      </div>
                    </div>
                    <div className="hidden p-3 text-right sm:block">
                      <span className={c.orderCount > 0 ? "text-dark-100" : "text-dark-500"}>{c.orderCount}</span>
                    </div>
                    <div className="hidden p-3 text-right md:block">
                      <span className={c.totalSpent > 0 ? "text-green-400" : "text-dark-500"}>{c.totalSpent > 0 ? formatPrice(c.totalSpent) : "—"}</span>
                    </div>
                    <div className="p-3 text-right text-xs text-dark-400">{formatDate(c.lastSignIn)}</div>
                  </div>
                  {expandedId === c.id && (
                    <div className="border-b border-dark-700/50 bg-dark-800/30 p-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="mb-1 text-xs font-medium text-dark-500">Hesap Bilgileri</p>
                          <p className="text-sm text-dark-200">Kayıt: {formatDateTime(c.createdAt)}</p>
                          <p className="text-sm text-dark-200">Son Giriş: {formatDateTime(c.lastSignIn)}</p>
                          <p className="text-sm text-dark-200">Giriş: {c.provider === "google" ? "Google OAuth" : "E-posta/Şifre"}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium text-dark-500">Premium</p>
                          {c.isPremium ? (
                            <>
                              <p className="text-sm font-bold text-amber-400">✅ Aktif Premium Üye</p>
                              <p className="text-xs text-dark-400">Yöntem: {c.premiumMethod === "admin_granted" ? "Admin" : c.premiumMethod === "with_order" ? "Sipariş" : c.premiumMethod || "—"}</p>
                              <p className="text-xs text-dark-400">Tarih: {formatDate(c.premiumDate)}</p>
                              <p className="text-xs text-dark-400">Süre: {c.premiumExpires ? formatDate(c.premiumExpires) : "Süresiz"}</p>
                            </>
                          ) : (
                            <p className="text-sm text-dark-400">Premium üye değil</p>
                          )}
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium text-dark-500">Sipariş & Newsletter</p>
                          <p className="text-sm text-dark-200">Sipariş: {c.orderCount} | Harcama: {c.totalSpent > 0 ? formatPrice(c.totalSpent) : "—"}</p>
                          <p className="text-sm text-dark-200">Son Sipariş: {formatDate(c.lastOrder)}</p>
                          <p className="text-sm text-dark-200">Newsletter: {c.newsletterActive ? <span className="text-green-400">Abone ({c.newsletterSource})</span> : <span className="text-dark-500">Hayır</span>}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-dark-500">{search ? "Sonuç bulunamadı" : "Henüz müşteri yok"}</div>}
      </div>

      <p className="text-xs text-dark-500">{filtered.length} / {customers.length} müşteri</p>

      {/* Mail Modal */}
      {showMailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-dark-600 bg-dark-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-700 p-4">
              <h3 className="font-bold text-dark-50"><Send size={16} className="mr-2 inline" />{selected.size} Kişiye Mail</h3>
              <button onClick={() => { setShowMailModal(false); setSendResult(null); }} className="text-dark-400 hover:text-dark-200"><X size={18} /></button>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-400">Şablon</label>
                <div className="flex gap-2">
                  {([
                    { key: "premium-teklif" as const, label: "Premium Teklif", icon: Crown },
                    { key: "kampanya" as const, label: "Kampanya", icon: ShoppingCart },
                    { key: "custom" as const, label: "Özel", icon: Mail },
                  ]).map((t) => (
                    <button key={t.key} onClick={() => {
                      setMailTemplate(t.key);
                      setMailSubject(t.key === "premium-teklif" ? "👑 Fiyatcim Premium ile Avantajlı Alışveriş!" : t.key === "kampanya" ? "🔥 Yeni Kampanya — Fiyatcim" : "");
                    }} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${mailTemplate === t.key ? "bg-primary-600 text-white" : "bg-dark-700 text-dark-300 hover:bg-dark-600"}`}>
                      <t.icon size={14} />{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-400">Konu</label>
                <input type="text" value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} placeholder="E-posta konusu..."
                  className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 focus:border-primary-500 focus:outline-none" />
              </div>
              {mailTemplate === "custom" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-dark-400">HTML İçerik</label>
                  <textarea value={mailCustomHtml} onChange={(e) => setMailCustomHtml(e.target.value)} rows={6} placeholder="<div>...</div>"
                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 font-mono text-xs text-dark-100 focus:border-primary-500 focus:outline-none" />
                </div>
              )}
              {sendResult && (
                <div className={`rounded-lg p-3 text-sm ${sendResult.failed > 0 ? "bg-yellow-900/30 text-yellow-300" : "bg-green-900/30 text-green-300"}`}>
                  <Check size={14} className="mr-1 inline" />{sendResult.sent} gönderildi{sendResult.failed > 0 ? `, ${sendResult.failed} başarısız` : ""}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-dark-700 p-4">
              <button onClick={() => { setShowMailModal(false); setSendResult(null); }} className="rounded-lg px-4 py-2 text-sm text-dark-300 hover:text-dark-100">İptal</button>
              <button onClick={handleSendMail} disabled={sending || !mailSubject.trim()}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">
                {sending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send size={14} />}
                {sending ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
