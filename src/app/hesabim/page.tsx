"use client";

import { useState, useEffect } from "react";
import { Mail, Phone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SmsOtpVerify from "@/components/ui/SmsOtpVerify";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type Tab = "profile" | "contact";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone || "—";
  return `${phone.slice(0, 4)}***${phone.slice(-2)}`;
}

export default function AccountPage() {
  const { user, profile, updateProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [saved, setSaved] = useState(false);

  // SMS doğrulama state
  const [pendingTelefon, setPendingTelefon] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setAd(profile.ad || "");
      setSoyad(profile.soyad || "");
      setTelefon(profile.telefon || "");
    }
  }, [profile]);

  if (!user) return null;

  const telefonChanged = telefon !== (profile?.telefon || "") && telefon.length >= 10;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Telefon değiştiyse ve demo modda → SMS doğrulama göster
    if (telefonChanged && IS_DEMO) {
      setPendingTelefon(telefon);
      return;
    }

    // Telefon değişmediyse veya non-demo → direkt kaydet
    updateProfile({ ad, soyad, telefon });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSmsVerified = () => {
    if (pendingTelefon) {
      updateProfile({ ad, soyad, telefon: pendingTelefon });
      setPendingTelefon(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Üyelik Bilgilerim" },
    { key: "contact", label: "İletişim Bilgileri" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-dark-900">Kullanıcı Bilgilerim</h1>

      {/* Tabs */}
      <div className="border-b border-dark-200">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-dark-500 hover:text-dark-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Üyelik Bilgilerim */}
      {tab === "profile" && (
        <div className="rounded-xl border border-dark-100 bg-white p-6">
          <h2 className="mb-1 text-lg font-bold text-dark-900">Profil Bilgileri</h2>
          <p className="mb-5 text-sm text-dark-500">
            Kişisel bilgilerinizi buradan güncelleyebilirsiniz.
          </p>

          {/* SMS Doğrulama — telefon değişikliği */}
          {pendingTelefon ? (
            <div className="rounded-xl border border-dark-100 p-6">
              <SmsOtpVerify
                phone={pendingTelefon}
                onVerified={handleSmsVerified}
                onBack={() => setPendingTelefon(null)}
              />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700">Ad</label>
                  <input
                    type="text"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700">Soyad</label>
                  <input
                    type="text"
                    value={soyad}
                    onChange={(e) => setSoyad(e.target.value)}
                    className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700">Telefon</label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
                />
                {telefonChanged && IS_DEMO && (
                  <p className="mt-1 text-xs text-orange-600">
                    Telefon değişikliği için SMS doğrulama gerekecektir.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
                >
                  {telefonChanged && IS_DEMO ? "Doğrula ve Güncelle" : "Güncelle"}
                </button>
                {saved && <span className="text-sm text-green-600">Kaydedildi!</span>}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab: İletişim Bilgileri */}
      {tab === "contact" && (
        <div className="rounded-xl border border-dark-100 bg-white p-6">
          <h2 className="mb-1 text-lg font-bold text-dark-900">İletişim Bilgileri</h2>
          <p className="mb-5 text-sm text-dark-500">
            E-posta adresinizi ve telefon numaranızı görüntüleyin.
          </p>

          <div className="space-y-5">
            {/* E-posta */}
            <div className="flex items-center justify-between rounded-lg border border-dark-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dark-50">
                  <Mail size={16} className="text-dark-500" />
                </div>
                <div>
                  <p className="text-xs text-dark-500">E-posta adresi</p>
                  <p className="text-sm font-medium text-dark-900">{maskEmail(user.email)}</p>
                </div>
              </div>
              <button
                disabled
                className="text-sm font-semibold text-primary-600 opacity-50"
                title="Yakında"
              >
                Değiştir
              </button>
            </div>

            {/* Telefon */}
            <div className="flex items-center justify-between rounded-lg border border-dark-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dark-50">
                  <Phone size={16} className="text-dark-500" />
                </div>
                <div>
                  <p className="text-xs text-dark-500">Cep telefon numarası</p>
                  <p className="text-sm font-medium text-dark-900">
                    {profile?.telefon ? maskPhone(profile.telefon) : "Belirtilmemiş"}
                  </p>
                </div>
              </div>
              <button
                disabled
                className="text-sm font-semibold text-primary-600 opacity-50"
                title="Yakında"
              >
                Değiştir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
