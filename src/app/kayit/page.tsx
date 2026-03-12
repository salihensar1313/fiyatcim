"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, Mail, ShieldCheck, ArrowLeft, ArrowRight, User, Smartphone } from "lucide-react";
import SmsOtpVerify from "@/components/ui/SmsOtpVerify";
import { useAuth } from "@/context/AuthContext";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { validatePassword, getPasswordStrength, PASSWORD_MIN_LENGTH } from "@/lib/password";

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
  const { signUp, signInWithGoogle } = useAuth();

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
  const [googleLoading, setGoogleLoading] = useState(false);

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
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      setError(pwCheck.error!);
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
    if (loading) return; // Prevent double-submit
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
                      : "bg-dark-100 dark:bg-dark-700 text-dark-500 dark:text-dark-300"
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

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-200 dark:border-dark-600" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-dark-500 dark:bg-dark-800 dark:text-dark-400">veya</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={async () => {
                  setGoogleLoading(true);
                  setError("");
                  const result = await signInWithGoogle();
                  if (result.error) {
                    setError(result.error);
                    setGoogleLoading(false);
                  } else if (IS_DEMO) {
                    router.push("/hesabim");
                  }
                }}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-dark-200 bg-white px-4 py-3 text-sm font-semibold text-dark-700 transition-all hover:border-dark-300 hover:bg-dark-50 hover:shadow-sm disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200 dark:hover:bg-dark-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {googleLoading ? "Yönlendiriliyor..." : "Google ile Kayıt Ol"}
              </button>
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

              {/* Demo bilgisi — sadece development ortamında göster */}
              {IS_DEMO && process.env.NODE_ENV === "development" && (
                <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Demo Modu</p>
                  <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">Herhangi bir 6 haneli kod ile doğrulama yapabilirsiniz.</p>
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
                    <p className="text-sm text-dark-500">
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
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-lg border border-r-0 border-dark-200 dark:border-dark-600 bg-dark-50 dark:bg-dark-600 px-3 text-sm font-medium text-dark-500 dark:text-dark-300">+90</span>
                    <input
                      type="tel"
                      value={telefon.slice(2)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                        setTelefon("90" + raw);
                      }}
                      placeholder="5XX XXX XX XX"
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-r-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Şifre</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="En az 8 karakter, büyük/küçük harf + rakam"
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 pr-10 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {password.length > 0 && (() => {
                    const strength = getPasswordStrength(password);
                    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
                    const labels = ["Zayıf", "Orta", "Güçlü", "Çok Güçlü"];
                    return (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full ${
                                level <= strength ? colors[strength - 1] : "bg-dark-200 dark:bg-dark-600"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-dark-500">
                          {labels[strength - 1] || "Çok Kısa"} — En az {PASSWORD_MIN_LENGTH} karakter, büyük/küçük harf ve rakam gerekli
                        </p>
                      </div>
                    );
                  })()}
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
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (allMandatoryChecked) {
                        setAgreeKVKK(false);
                        setAgreeTerms(false);
                        setAgreePrivacy(false);
                      } else {
                        setAgreeKVKK(true);
                        setAgreeTerms(true);
                        setAgreePrivacy(true);
                      }
                    }}
                    className="text-xs font-medium text-primary-600 hover:underline"
                  >
                    {allMandatoryChecked ? "Tüm Seçimleri Kaldır" : "Zorunlu Sözleşmeleri Onayla"}
                  </button>
                </div>

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
                    Kampanya, indirim ve duyurulardan e-posta ile haberdar olmak istiyorum. <span className="text-dark-500">(Opsiyonel)</span>
                  </span>
                </label>

                <p className="text-xs text-dark-500">
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
