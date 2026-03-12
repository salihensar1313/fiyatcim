"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Smartphone } from "lucide-react";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DEMO_OTP = "123456";
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 dakika
const OTP_COOLDOWN_MS = 60 * 1000; // 60 saniye resend cooldown
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
  const [otpSentAt, setOtpSentAt] = useState<number>(Date.now());
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(60);
  const [lockLeft, setLockLeft] = useState(0);
  const [error, setError] = useState("");

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

  const handleVerify = useCallback(() => {
    setError("");
    const now = Date.now();

    // Kilit kontrolü
    if (lockedUntil > now) {
      setError(`Çok fazla hatalı deneme. ${Math.ceil((lockedUntil - now) / 1000)} saniye bekleyin.`);
      return;
    }

    // OTP süre kontrolü
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

    // Başarılı doğrulama
    onVerified();
  }, [otpCode, otpAttempts, lockedUntil, otpSentAt, onVerified]);

  const handleResend = () => {
    setOtpSentAt(Date.now());
    setOtpCode("");
    setError("");
    setOtpAttempts(0);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <Smartphone size={24} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-dark-900 dark:text-dark-50">SMS Doğrulama</h2>
        <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
          <span className="font-medium text-dark-700 dark:text-dark-200">{maskPhone(phone)}</span> numarasına gönderilen 6 haneli kodu girin
        </p>
      </div>

      {/* Demo bilgisi */}
      {IS_DEMO && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Demo Modu</p>
          <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
            SMS doğrulama kodu: <span className="font-mono font-bold">123456</span>
          </p>
        </div>
      )}

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
        onClick={handleVerify}
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
            onClick={handleResend}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Kodu tekrar gönder
          </button>
        )}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="flex w-full items-center justify-center gap-2 text-sm text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200"
        >
          <ArrowLeft size={14} />
          Geri Dön
        </button>
      )}
    </div>
  );
}
