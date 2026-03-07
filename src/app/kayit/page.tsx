"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, Mail, ShieldCheck, ArrowLeft, ArrowRight, User, Smartphone } from "lucide-react";
import SmsOtpVerify from "@/components/ui/SmsOtpVerify";
import { useAuth } from "@/context/AuthContext";
import Breadcrumb from "@/components/ui/Breadcrumb";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DEMO_OTP = "123456";
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 dakika
const OTP_COOLDOWN_MS = 60 * 1000; // 60 saniye resend cooldown
const MAX_OTP_ATTEMPTS = 5;
const LOCK_DURATION_MS = 2 * 60 * 1000; // 2 dakika kilit

type Step = "email" | "otp" | "info" | "sms" | "agreements";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  // Step 1: E-posta
  const [email, setEmail] = useState("");

  // Step 3: Kişisel bilgiler
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("905");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step state
  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 2: OTP
  const [otpCode, setOtpCode] = useState("");
  const [otpSentAt, setOtpSentAt] = useState<number>(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);

  // Step 4: Agreements
  const [agreeKVKK, setAgreeKVKK] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // Cooldown & lock timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (lockedUntil > now) {
        setLockLeft(Math.ceil((lockedUntil - now) / 1000));
      } else {
        setLockLeft(0);
      }
      if (otpSentAt > 0) {
        const elapsed = now - otpSentAt;
        const remaining = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
        setCooldownLeft(remaining > 0 ? remaining : 0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil, otpSentAt]);

  // Step 1 → Step 2 (demo) veya Step 3 (non-demo, OTP atla)
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("E-posta adresi zorunludur.");
      return;
    }

    if (IS_DEMO) {
      // Demo: OTP gönder
      setOtpSentAt(Date.now());
      setStep("otp");
    } else {
      // Non-demo: OTP adımını atla, Supabase email verification ile halleder
      setStep("info");
    }
  };

  // OTP doğrulama → Step 3
  const handleOtpVerify = useCallback(() => {
    setError("");
    const now = Date.now();

    // Kilit kontrolü
    if (lockedUntil > now) {
      setError(`Çok fazla hatalı deneme. ${Math.ceil((lockedUntil - now) / 1000)} saniye bekleyin.`);
      return;
    }

    // OTP süre kontrolü (5 dk)
    if (now - otpSentAt > OTP_EXPIRY_MS) {
      setError("Doğrulama kodu süresi doldu. Yeni kod gönderin.");
      return;
    }

    if (otpCode !== DEMO_OTP) {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        const lockTime = now + LOCK_DURATION_MS;
        setLockedUntil(lockTime);
        setOtpAttempts(0);
        setError("5 hatalı deneme. 2 dakika kilitlendi.");
      } else {
        setError(`Hatalı kod. ${MAX_OTP_ATTEMPTS - newAttempts} deneme hakkınız kaldı.`);
      }
      return;
    }

    // Başarılı doğrulama → bilgiler adımına geç
    setStep("info");
  }, [otpCode, otpAttempts, lockedUntil, otpSentAt]);

  // OTP tekrar gönder
  const handleResendOtp = () => {
    setOtpSentAt(Date.now());
    setOtpCode("");
    setError("");
    setOtpAttempts(0);
  };

  // Step 3 → Step 4 (SMS) veya Step 5 (Sözleşmeler)
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!ad.trim() || !soyad.trim()) {
      setError("Ad ve soyad zorunludur.");
      return;
    }
    if (telefon.length < 12) {
      setError("Geçerli bir telefon numarası girin.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    if (IS_DEMO) {
      setStep("sms");
    } else {
      setStep("agreements");
    }
  };

  // Son adım: Kayıt tamamla
  const handleFinalSubmit = async () => {
    setError("");
    if (!agreeKVKK || !agreeTerms || !agreePrivacy) {
      setError("Zorunlu sözleşmeleri kabul etmelisiniz.");
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, ad, soyad, telefon);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/hesabim");
    }
  };

  const allMandatoryChecked = agreeKVKK && agreeTerms && agreePrivacy;

  // Step indicator — non-demo'da OTP/SMS adımları yok
  const steps: { key: Step; label: string; icon: typeof UserPlus }[] = IS_DEMO
    ? [
        { key: "email", label: "E-posta", icon: Mail },
        { key: "otp", label: "Doğrulama", icon: ShieldCheck },
        { key: "info", label: "Bilgiler", icon: User },
        { key: "sms", label: "SMS", icon: Smartphone },
        { key: "agreements", label: "Sözleşmeler", icon: ShieldCheck },
      ]
    : [
        { key: "email", label: "E-posta", icon: Mail },
        { key: "info", label: "Bilgiler", icon: User },
        { key: "agreements", label: "Sözleşmeler", icon: ShieldCheck },
      ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Kayıt Ol" }]} />
      </div>

      <div className="container mx-auto flex justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-8">
          {/* Step Indicator */}
          <div className="mb-6 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-6 bg-dark-200 dark:bg-dark-600" />}
                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                    i <= currentStepIndex
                      ? "bg-primary-600 text-white"
                      : "bg-dark-100 dark:bg-dark-700 text-dark-400 dark:text-dark-300"
                  }`}
                >
                  <s.icon size={14} />
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* STEP 1: E-posta */}
          {step === "email" && (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Kayıt Ol</h1>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">Önce e-posta adresinizi doğrulayalım</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">E-posta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600">{error}</div>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700"
                >
                  Doğrulama Kodu Gönder
                  <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {/* STEP 2: OTP Doğrulama */}
          {step === "otp" && (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">E-posta Doğrulama</h1>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
                  <span className="font-medium text-dark-700 dark:text-dark-200">{email}</span> adresine gönderilen 6 haneli kodu girin
                </p>
              </div>

              {/* Demo bilgisi — sadece demo modda */}
              {IS_DEMO && (
                <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Demo Modu</p>
                  <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">Doğrulama kodu: <span className="font-mono font-bold">123456</span></p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Doğrulama Kodu</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={OTP_LENGTH}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                    placeholder="000000"
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                    disabled={lockLeft > 0}
                  />
                </div>

                {lockLeft > 0 && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600">
                    Hesap kilitlendi. {lockLeft} saniye bekleyin.
                  </div>
                )}

                {error && lockLeft === 0 && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600">{error}</div>
                )}

                <button
                  onClick={handleOtpVerify}
                  disabled={otpCode.length !== OTP_LENGTH || lockLeft > 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  Doğrula
                  <ArrowRight size={16} />
                </button>

                {/* Tekrar gönder */}
                <div className="text-center">
                  {cooldownLeft > 0 ? (
                    <p className="text-sm text-dark-400">
                      Yeni kod göndermek için {cooldownLeft} saniye bekleyin
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Kodu tekrar gönder
                    </button>
                  )}
                </div>

                <button
                  onClick={() => { setStep("email"); setError(""); }}
                  className="flex w-full items-center justify-center gap-2 text-sm text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200"
                >
                  <ArrowLeft size={14} />
                  Geri Dön
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Bilgiler */}
          {step === "info" && (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Kişisel Bilgiler</h1>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">Hesap bilgilerinizi tamamlayın</p>
              </div>

              {/* Doğrulanmış e-posta */}
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 p-3">
                <ShieldCheck size={16} className="text-green-600" />
                <span className="text-sm text-green-700">
                  <span className="font-medium">{email}</span> doğrulandı
                </span>
              </div>

              <form onSubmit={handleInfoSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Ad</label>
                    <input
                      type="text"
                      value={ad}
                      onChange={(e) => setAd(e.target.value)}
                      placeholder="Adınız"
                      required
                      className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Soyad</label>
                    <input
                      type="text"
                      value={soyad}
                      onChange={(e) => setSoyad(e.target.value)}
                      placeholder="Soyadınız"
                      required
                      className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Telefon</label>
                  <input
                    type="tel"
                    value={telefon.replace(/(\d{2})(\d{3})(\d{0,3})(\d{0,2})(\d{0,2})/, (_m: string, a: string, b: string, c: string, d: string, e: string) => [a, b, c, d, e].filter(Boolean).join(" "))}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      if (raw.length < 3 || !raw.startsWith("905")) return;
                      if (raw.length <= 12) setTelefon(raw);
                    }}
                    placeholder="90 5XX XXX XX XX"
                    inputMode="numeric"
                    maxLength={16}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Şifre</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 pr-10 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Şifre Tekrar</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    required
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600">{error}</div>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700"
                >
                  Devam Et
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(IS_DEMO ? "otp" : "email"); setError(""); }}
                  className="flex w-full items-center justify-center gap-2 text-sm text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200"
                >
                  <ArrowLeft size={14} />
                  Geri Dön
                </button>
              </form>
            </>
          )}

          {/* STEP 4: SMS Doğrulama */}
          {step === "sms" && (
            <SmsOtpVerify
              phone={telefon}
              onVerified={() => setStep("agreements")}
              onBack={() => setStep("info")}
            />
          )}

          {/* STEP 5: Sözleşmeler */}
          {step === "agreements" && (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Sözleşmeler</h1>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">Kayıt için gerekli sözleşmeleri onaylayın</p>
              </div>

              <div className="space-y-3">
                {/* KVKK — zorunlu */}
                <label className="flex items-start gap-3 rounded-lg border border-dark-100 dark:border-dark-700 p-3 transition-colors hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800">
                  <input
                    type="checkbox"
                    checked={agreeKVKK}
                    onChange={(e) => setAgreeKVKK(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-dark-700 dark:text-dark-200">
                    <Link href="/kvkk" target="_blank" className="font-medium text-primary-600 hover:underline">
                      KVKK Aydınlatma Metni
                    </Link>
                    {"\u2019"}ni okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                  </span>
                </label>

                {/* Kullanım Koşulları — zorunlu */}
                <label className="flex items-start gap-3 rounded-lg border border-dark-100 dark:border-dark-700 p-3 transition-colors hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-dark-700 dark:text-dark-200">
                    <Link href="/kullanim-kosullari" target="_blank" className="font-medium text-primary-600 hover:underline">
                      Kullanım Koşulları
                    </Link>
                    {"\u2019"}nı okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                  </span>
                </label>

                {/* Gizlilik — zorunlu */}
                <label className="flex items-start gap-3 rounded-lg border border-dark-100 dark:border-dark-700 p-3 transition-colors hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-dark-700 dark:text-dark-200">
                    <Link href="/gizlilik" target="_blank" className="font-medium text-primary-600 hover:underline">
                      Gizlilik Politikası
                    </Link>
                    {"\u2019"}nı okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                  </span>
                </label>

                {/* Marketing — opsiyonel */}
                <label className="flex items-start gap-3 rounded-lg border border-dark-100 dark:border-dark-700 p-3 transition-colors hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800">
                  <input
                    type="checkbox"
                    checked={agreeMarketing}
                    onChange={(e) => setAgreeMarketing(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-dark-700 dark:text-dark-200">
                    Kampanya, indirim ve duyurulardan e-posta ile haberdar olmak istiyorum. <span className="text-dark-400">(Opsiyonel)</span>
                  </span>
                </label>

                <p className="text-xs text-dark-400">
                  <span className="text-primary-600">*</span> ile işaretli alanlar zorunludur.
                </p>

                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600">{error}</div>
                )}

                <button
                  onClick={handleFinalSubmit}
                  disabled={!allMandatoryChecked || loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus size={18} />
                  {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                </button>

                <button
                  onClick={() => { setStep(IS_DEMO ? "sms" : "info"); setError(""); }}
                  className="flex w-full items-center justify-center gap-2 text-sm text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200"
                >
                  <ArrowLeft size={14} />
                  Geri Dön
                </button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-500 dark:text-dark-400">
              Zaten hesabınız var mı?{" "}
              <Link href="/giris" className="font-semibold text-primary-600 hover:text-primary-700">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
