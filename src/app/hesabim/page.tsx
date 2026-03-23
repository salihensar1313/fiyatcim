"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Phone, Camera, Trash2, Lock, AlertTriangle, Eye, EyeOff, X, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
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

type Tab = "profile" | "contact" | "security";

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

export default function AccountPageWrapper() {
  return (
    <Suspense fallback={null}>
      <AccountPage />
    </Suspense>
  );
}

function AccountPage() {
  const { user, profile, updateProfile, changePassword, updateEmail, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("profile");
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SMS doğrulama state
  const [pendingTelefon, setPendingTelefon] = useState<string | null>(null);

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  // Email change state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Login success toast
  useEffect(() => {
    const loginParam = searchParams.get("login");
    if (loginParam === "google" || loginParam === "success") {
      showToast("Giriş başarılı! Hoş geldiniz.", "success");
      // URL'den parametreyi temizle
      window.history.replaceState({}, "", "/hesabim");
    }
  }, [searchParams, showToast]);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      showToast("Yeni şifreler eşleşmiyor.", "error");
      return;
    }
    setPwLoading(true);
    const result = await changePassword(currentPw, newPw);
    setPwLoading(false);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Şifreniz başarıyla değiştirildi.", "success");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const result = await deleteAccount();
    setDeleteLoading(false);
    if (result.error) {
      showToast(result.error, "error");
    } else if (result.message) {
      // E-posta onay akışı — kullanıcıya bilgi ver
      showToast(result.message, "success");
      setDeleteConfirm(false);
      setDeleteText("");
    } else {
      // Demo mod — doğrudan silindi
      showToast("Hesabınız silindi.", "success");
      router.push("/");
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      showToast("Geçerli bir e-posta adresi giriniz.", "error");
      return;
    }
    setEmailLoading(true);
    const result = await updateEmail(newEmail);
    setEmailLoading(false);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      if (IS_DEMO) {
        showToast("E-posta adresiniz başarıyla güncellendi.", "success");
        setEmailModalOpen(false);
        setNewEmail("");
      } else {
        setEmailSuccess(true);
      }
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Üyelik Bilgilerim" },
    { key: "contact", label: "İletişim Bilgileri" },
    { key: "security", label: "Güvenlik" },
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
                onClick={() => { setEmailModalOpen(true); setEmailSuccess(false); setNewEmail(""); }}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Değiştir
              </button>
            </div>

            {/* Email Change Modal */}
            {emailModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-dark-800 p-6 shadow-xl">
                  <button
                    onClick={() => { setEmailModalOpen(false); setEmailSuccess(false); setNewEmail(""); }}
                    className="absolute right-4 top-4 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200"
                  >
                    <X size={20} />
                  </button>

                  {emailSuccess ? (
                    <div className="text-center py-4">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle size={28} className="text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-dark-900 dark:text-dark-50 mb-2">
                        Doğrulama E-postası Gönderildi
                      </h3>
                      <p className="text-sm text-dark-500 dark:text-dark-400 mb-2">
                        <span className="font-medium text-dark-700 dark:text-dark-200">{newEmail}</span> adresine bir doğrulama e-postası gönderdik.
                      </p>
                      <p className="text-sm text-dark-500 dark:text-dark-400 mb-6">
                        E-postanızdaki bağlantıya tıklayarak değişikliği onaylayın. Onaylanana kadar mevcut e-posta adresiniz geçerli olmaya devam edecektir.
                      </p>
                      <button
                        onClick={() => { setEmailModalOpen(false); setEmailSuccess(false); setNewEmail(""); }}
                        className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
                      >
                        Tamam
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-dark-900 dark:text-dark-50 mb-1">
                        E-posta Adresini Değiştir
                      </h3>
                      <p className="text-sm text-dark-500 dark:text-dark-400 mb-5">
                        Yeni e-posta adresinize bir doğrulama bağlantısı gönderilecektir.
                      </p>
                      <form onSubmit={handleChangeEmail} className="space-y-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                            Mevcut E-posta
                          </label>
                          <p className="text-sm text-dark-500 dark:text-dark-400 bg-dark-50 dark:bg-dark-700 rounded-lg px-4 py-2.5">
                            {user.email}
                          </p>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                            Yeni E-posta
                          </label>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="yeni@eposta.com"
                            required
                            className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={emailLoading || !newEmail || newEmail === user.email}
                            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
                          >
                            {emailLoading ? "Gönderiliyor..." : "Doğrulama Gönder"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEmailModalOpen(false); setNewEmail(""); }}
                            className="rounded-lg border border-dark-200 dark:border-dark-600 px-6 py-2.5 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700"
                          >
                            Vazgeç
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}

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

      {/* Tab: Güvenlik */}
      {tab === "security" && (
        <div className="space-y-6">
          {/* Şifre Değiştir */}
          <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={18} className="text-dark-700 dark:text-dark-200" />
              <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Şifre Değiştir</h2>
            </div>
            <p className="mb-5 text-sm text-dark-500 dark:text-dark-400">
              Hesabınızın güvenliği için şifrenizi düzenli olarak değiştirin.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Mevcut Şifre</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    required
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 pr-10 text-sm focus:border-primary-600 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Yeni Şifre</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 pr-10 text-sm focus:border-primary-600 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
                />
                {confirmPw && newPw !== confirmPw && (
                  <p className="mt-1 text-xs text-red-600">Şifreler eşleşmiyor.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={pwLoading || !currentPw || !newPw || newPw !== confirmPw}
                className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {pwLoading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
              </button>
            </form>
          </div>

          {/* Hesap Silme */}
          <div className="rounded-xl border border-red-200 bg-white dark:border-red-900/50 dark:bg-dark-800 p-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={18} className="text-red-600" />
              <h2 className="text-lg font-bold text-red-600">Hesabı Sil</h2>
            </div>
            <p className="mb-5 text-sm text-dark-500 dark:text-dark-400">
              Hesap silme talebi oluşturduğunuzda e-posta adresinize bir onay bağlantısı gönderilir. Hesabınız yalnızca bu bağlantı üzerinden silinebilir.
            </p>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="rounded-lg border border-red-300 dark:border-red-800 px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Hesabımı Sil
              </button>
            ) : (
              <div className="space-y-4 max-w-md">
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">
                    Bu işlem geri alınamaz! Onaylamak için aşağıya &quot;HESABIMI SIL&quot; yazın.
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500 mb-3">
                    E-posta adresinize bir onay bağlantısı gönderilecektir. Hesabınız yalnızca bu bağlantı ile silinebilir.
                  </p>
                  <input
                    type="text"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="HESABIMI SIL"
                    className="w-full rounded-lg border border-red-300 dark:border-red-800 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteText !== "HESABIMI SIL"}
                    className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading ? "Gönderiliyor..." : "Onay E-postası Gönder"}
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(false); setDeleteText(""); }}
                    className="rounded-lg border border-dark-200 dark:border-dark-600 px-6 py-2.5 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
