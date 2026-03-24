"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

interface Factor {
  id: string;
  friendlyName: string;
  status: string;
  createdAt: string;
}

export default function MfaSection() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasActiveMfa = factors.some((f) => f.status === "verified");

  useEffect(() => {
    if (user) loadFactors();
  }, [user]);

  async function loadFactors() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      if (data) {
        setFactors(
          data.totp.map((f) => ({
            id: f.id,
            friendlyName: f.friendly_name || "Authenticator",
            status: f.status,
            createdAt: f.created_at,
          }))
        );
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Fiyatcim Authenticator",
      });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: unknown) {
      showToast((err as Error).message || "MFA kurulumu başarısız.", "error");
    }
    setEnrolling(false);
  }

  async function handleVerify() {
    if (code.length !== 6) {
      showToast("6 haneli doğrulama kodunu girin.", "error");
      return;
    }
    setVerifying(true);
    try {
      const supabase = createClient();
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr) throw cErr;

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;

      showToast("İki faktörlü doğrulama aktifleştirildi!", "success");
      setQrCode("");
      setSecret("");
      setFactorId("");
      setCode("");
      loadFactors();
    } catch (err: unknown) {
      showToast((err as Error).message || "Doğrulama başarısız.", "error");
    }
    setVerifying(false);
  }

  async function handleUnenroll(fId: string) {
    if (!confirm("İki faktörlü doğrulamayı kaldırmak istediğinize emin misiniz?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId: fId });
      if (error) throw error;
      showToast("İki faktörlü doğrulama kaldırıldı.", "info");
      loadFactors();
    } catch (err: unknown) {
      showToast((err as Error).message || "Kaldırma başarısız.", "error");
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-dark-100 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
        <div className="flex items-center gap-2">
          <Loader2 size={18} className="animate-spin text-dark-400" />
          <span className="text-sm text-dark-500">MFA durumu yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dark-100 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
      <div className="mb-1 flex items-center gap-2">
        {hasActiveMfa ? (
          <ShieldCheck size={18} className="text-green-600" />
        ) : (
          <Shield size={18} className="text-dark-700 dark:text-dark-200" />
        )}
        <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">
          İki Faktörlü Doğrulama (2FA)
        </h2>
        {hasActiveMfa && (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Aktif
          </span>
        )}
      </div>
      <p className="mb-5 text-sm text-dark-500 dark:text-dark-400">
        Google Authenticator veya benzeri bir uygulama ile hesabınızı ekstra koruma altına alın.
      </p>

      {/* Aktif faktörler */}
      {factors.filter((f) => f.status === "verified").map((f) => (
        <div
          key={f.id}
          className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-medium text-dark-900 dark:text-dark-50">
                {f.friendlyName}
              </p>
              <p className="text-xs text-dark-500">
                Eklenme: {new Date(f.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleUnenroll(f.id)}
            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10"
          >
            <ShieldOff size={14} />
            Kaldır
          </button>
        </div>
      ))}

      {/* QR kod gösterimi (enrollment sırasında) */}
      {qrCode && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/30 dark:bg-amber-900/10">
          <p className="mb-4 text-sm font-medium text-dark-700 dark:text-dark-200">
            Authenticator uygulamanız ile QR kodu tarayın:
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="MFA QR Code" className="mx-auto mb-4 h-48 w-48 rounded-lg" />

          <div className="mb-4">
            <p className="mb-1 text-xs text-dark-500">Manuel giriş anahtarı:</p>
            <div className="mx-auto flex max-w-xs items-center gap-2 rounded-lg bg-dark-100 px-3 py-2 dark:bg-dark-700">
              <code className="flex-1 break-all text-xs font-mono text-dark-700 dark:text-dark-200">
                {secret}
              </code>
              <button onClick={copySecret} className="shrink-0 text-dark-400 hover:text-dark-600">
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-xs">
            <label className="mb-1 block text-left text-sm font-medium text-dark-700 dark:text-dark-200">
              6 haneli doğrulama kodu:
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="mb-3 w-full rounded-lg border border-dark-200 px-4 py-2.5 text-center text-lg font-mono tracking-widest focus:border-primary-600 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
            />
            <button
              onClick={handleVerify}
              disabled={verifying || code.length !== 6}
              className="w-full rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {verifying ? "Doğrulanıyor..." : "Doğrula ve Aktifleştir"}
            </button>
          </div>
        </div>
      )}

      {/* Kurulum butonu */}
      {!hasActiveMfa && !qrCode && (
        <button
          onClick={handleEnroll}
          disabled={enrolling}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {enrolling ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Shield size={16} />
          )}
          {enrolling ? "Hazırlanıyor..." : "2FA Kurulumunu Başlat"}
        </button>
      )}
    </div>
  );
}
