"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from "react";
import { Mail, Phone, Camera, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SmsOtpVerify from "@/components/ui/SmsOtpVerify";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const MAX_AVATAR_SIZE = 200; // px — resize to this max dimension
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > MAX_AVATAR_SIZE || h > MAX_AVATAR_SIZE) {
          if (w > h) {
            h = Math.round((h * MAX_AVATAR_SIZE) / w);
            w = MAX_AVATAR_SIZE;
          } else {
            w = Math.round((w * MAX_AVATAR_SIZE) / h);
            h = MAX_AVATAR_SIZE;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/webp", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SMS doğrulama state
  const [pendingTelefon, setPendingTelefon] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setAd(profile.ad || "");
      setSoyad(profile.soyad || "");
      setTelefon(profile.telefon || "");
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_FILE_SIZE) {
      alert("Dosya boyutu 5MB'dan küçük olmalıdır.");
      return;
    }
    setAvatarUploading(true);
    try {
      const base64 = await resizeImage(file);
      updateProfile({ avatar: base64 });
    } catch {
      alert("Fotoğraf yüklenirken hata oluştu.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    updateProfile({ avatar: "" });
  };

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
      <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Kullanıcı Bilgilerim</h1>

      {/* Tabs */}
      <div className="border-b border-dark-200 dark:border-dark-700">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Üyelik Bilgilerim */}
      {tab === "profile" && (
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
            <h2 className="mb-1 text-lg font-bold text-dark-900 dark:text-dark-50">Profil Fotoğrafı</h2>
            <p className="mb-5 text-sm text-dark-500 dark:text-dark-400">
              Profil fotoğrafınızı ekleyin veya değiştirin.
            </p>
            <div className="flex items-center gap-5">
              {/* Avatar Preview */}
              <div className="relative">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profil fotoğrafı"
                    className="h-20 w-20 rounded-full object-cover border-2 border-dark-100 dark:border-dark-600"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-2xl font-bold text-primary-600">
                    {(profile?.ad?.[0] || user?.email[0] || "U").toUpperCase()}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  <Camera size={16} />
                  {profile?.avatar ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle"}
                </button>
                {profile?.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-2 rounded-lg border border-dark-200 dark:border-dark-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 size={16} />
                    Kaldır
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-xs text-dark-500">JPG, PNG veya WebP. Maks. 5MB.</p>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
          <h2 className="mb-1 text-lg font-bold text-dark-900 dark:text-dark-50">Profil Bilgileri</h2>
          <p className="mb-5 text-sm text-dark-500 dark:text-dark-400">
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
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Ad</label>
                  <input
                    type="text"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Soyad</label>
                  <input
                    type="text"
                    value={soyad}
                    onChange={(e) => setSoyad(e.target.value)}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Telefon</label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
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
        </div>
      )}

      {/* Tab: İletişim Bilgileri */}
      {tab === "contact" && (
        <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
          <h2 className="mb-1 text-lg font-bold text-dark-900 dark:text-dark-50">İletişim Bilgileri</h2>
          <p className="mb-5 text-sm text-dark-500 dark:text-dark-400">
            E-posta adresinizi ve telefon numaranızı görüntüleyin.
          </p>

          <div className="space-y-5">
            {/* E-posta */}
            <div className="flex items-center justify-between rounded-lg border border-dark-100 dark:border-dark-700 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dark-50 dark:bg-dark-800">
                  <Mail size={16} className="text-dark-500 dark:text-dark-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-500 dark:text-dark-400">E-posta adresi</p>
                  <p className="text-sm font-medium text-dark-900 dark:text-dark-50">{maskEmail(user.email)}</p>
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
            <div className="flex items-center justify-between rounded-lg border border-dark-100 dark:border-dark-700 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dark-50 dark:bg-dark-800">
                  <Phone size={16} className="text-dark-500 dark:text-dark-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Cep telefon numarası</p>
                  <p className="text-sm font-medium text-dark-900 dark:text-dark-50">
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
