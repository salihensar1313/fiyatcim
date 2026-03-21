"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Smartphone } from "lucide-react";

const OTP_LENGTH = 6;
const OTP_COOLDOWN_MS = 60 * 1000; // 60 saniye resend cooldown
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 dakika
const MAX_OTP_ATTEMPTS = 5;
const LOCK_DURATION_MS = 2 * 60 * 1000; // 2 dakika kilit

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone || "";
  return `${phone.slice(0, 3)}${"*".repeat(phone.length - 5)}${phone.slice(-2)}`;
}

interface SmsOtpVerifyProps {
  phone: string;
  onVerified: () => void;
  onBack?: () => void;
}

export default function SmsOtpVerify({ phone, onVerified, onBack }: SmsOtpVerifyProps) {
  const [otpCode, setOtpCode] = useState("");
  const [otpSentAt, setOtpSentAt] = useState<number>(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);

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

  // Ilk yuklemede otomatik OTP gonder
  useEffect(() => {
    if (phone && otpSentAt === 0) {
      handleSendOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const handleSendOTP = async () => {
    setSending(true);
    setError("");
    setDemoCode(null);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "SMS gonderilemedi. Lutfen tekrar deneyin.");
        return;
      }

      setOtpSentAt(Date.now());
      setOtpCode("");
      setOtpAttempts(0);

      // Mock modda demo kodu goster
      if (data.code) {
        setDemoCode(data.code);
      }
    } catch {
      setError("Baglanti hatasi. Lutfen internet baglantinizi kontrol edin.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = useCallback(async () => {
    setError("");
    const now = Date.now();

    // Kilit kontrolu
    if (lockedUntil > now) {
      setError(`Cok fazla hatali deneme. ${Math.ceil((lockedUntil - now) / 1000)} saniye bekleyin.`);
      return;
    }

    // OTP sure kontrolu
    if (otpSentAt > 0 && now - otpSentAt > OTP_EXPIRY_MS) {
      setError("Dogrulama kodu suresi doldu. Yeni kod gonderin.");
      return;
    }

    setVerifying(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Dogrulama sirasinda bir hata olustu.");
        return;
      }

      if (data.verified) {
        onVerified();
      } else {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);
        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          const lockTime = now + LOCK_DURATION_MS;
          setLockedUntil(lockTime);
          setOtpAttempts(0);
          setError("5 hatali deneme. 2 dakika kilitlendi.");
        } else {
          setError(`Hatali kod. ${MAX_OTP_ATTEMPTS - newAttempts} deneme hakkiniz kaldi.`);
        }
      }
    } catch {
      setError("Baglanti hatasi. Lutfen tekrar deneyin.");
    } finally {
      setVerifying(false);
    }
  }, [otpCode, otpAttempts, lockedUntil, otpSentAt, phone, onVerified]);

  const handleResend = () => {
    handleSendOTP();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <Smartphone size={24} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-dark-900 dark:text-dark-50">SMS Dogrulama</h2>
        <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
          <span className="font-medium text-dark-700 dark:text-dark-200">{maskPhone(phone)}</span> numarasina gonderilen 6 haneli kodu girin
        </p>
      </div>

      {/* Demo/Mock bilgisi */}
      {demoCode && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Test Modu</p>
          <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
            SMS dogrulama kodu: <span className="font-mono font-bold">{demoCode}</span>
          </p>
        </div>
      )}

      {/* Gonderiliyor durumu */}
      {sending && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/30 p-3 text-center">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">SMS gonderiliyor...</p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Dogrulama Kodu</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={OTP_LENGTH}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
          placeholder="000000"
          className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
          disabled={lockLeft > 0 || sending}
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
        onClick={handleVerify}
        disabled={otpCode.length !== OTP_LENGTH || lockLeft > 0 || verifying || sending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        {verifying ? "Dogrulanıyor..." : "Dogrula"}
        {!verifying && <ArrowRight size={16} />}
      </button>

      {/* Tekrar gonder */}
      <div className="text-center">
        {cooldownLeft > 0 ? (
          <p className="text-sm text-dark-500">
            Yeni kod gondermek icin {cooldownLeft} saniye bekleyin
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            Kodu tekrar gonder
          </button>
        )}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="flex w-full items-center justify-center gap-2 text-sm text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200"
        >
          <ArrowLeft size={14} />
          Geri Don
        </button>
      )}
    </div>
  );
}
