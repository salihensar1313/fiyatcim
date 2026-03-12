"use client";

import { useState } from "react";
import { X, User, Lock, Calendar, Mail, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface CustomerData {
  user_id: string;
  email: string;
  ad: string;
  soyad: string;
  telefon: string;
  role: string;
  created_at: string;
}

interface CustomerEditModalProps {
  customer: CustomerData;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerEditModal({ customer, onClose, onSaved }: CustomerEditModalProps) {
  const { adminUpdateUser, adminChangePassword } = useAuth();
  const { showToast } = useToast();
  const focusTrapRef = useFocusTrap<HTMLDivElement>();

  // Profile form
  const [ad, setAd] = useState(customer.ad);
  const [soyad, setSoyad] = useState(customer.soyad);
  const [telefon, setTelefon] = useState(customer.telefon || "");

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleSaveProfile = () => {
    if (!ad.trim() || !soyad.trim()) {
      showToast("Ad ve soyad zorunludur.", "error");
      return;
    }
    adminUpdateUser(customer.user_id, { ad: ad.trim(), soyad: soyad.trim(), telefon: telefon.trim() });
    showToast("Müşteri bilgileri güncellendi.", "success");
    onSaved();
  };

  const handleChangePassword = async () => {
    const result = await adminChangePassword(customer.email, newPassword);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    showToast("Şifre başarıyla değiştirildi.", "success");
    setNewPassword("");
    setShowPasswordSection(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div ref={focusTrapRef} className="relative mx-auto w-full max-w-[95vw] rounded-xl bg-white dark:bg-dark-800 shadow-xl sm:max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-100 px-6 py-4 dark:border-dark-700">
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Müşteri Düzenle</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-dark-400 hover:bg-dark-50 hover:text-dark-600 dark:text-dark-300 dark:hover:bg-dark-700">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {/* Read-only info */}
          <div className="mb-6 space-y-3 rounded-lg bg-dark-50 p-4 dark:bg-dark-700">
            <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
              <Mail size={14} className="text-dark-400" />
              <span className="font-medium">E-posta:</span>
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
              <Shield size={14} className="text-dark-400" />
              <span className="font-medium">Rol:</span>
              <span className={customer.role === "admin" ? "font-semibold text-primary-600" : ""}>
                {customer.role === "admin" ? "Admin" : "Kullanıcı"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
              <Calendar size={14} className="text-dark-400" />
              <span className="font-medium">Kayıt:</span>
              <span>{customer.created_at ? formatDate(customer.created_at) : "—"}</span>
            </div>
          </div>

          {/* Editable profile */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-dark-50">
              <User size={16} />
              Profil Bilgileri
            </h3>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-dark-600 dark:text-dark-300">Ad *</label>
                  <input
                    type="text"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-dark-600 dark:text-dark-300">Soyad *</label>
                  <input
                    type="text"
                    value={soyad}
                    onChange={(e) => setSoyad(e.target.value)}
                    className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-600 dark:text-dark-300">Telefon</label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
                />
              </div>
            </div>
          </div>

          {/* Password section */}
          <div className="border-t border-dark-100 pt-4 dark:border-dark-700">
            {!showPasswordSection ? (
              <button
                onClick={() => setShowPasswordSection(true)}
                className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <Lock size={14} />
                Şifre Değiştir
              </button>
            ) : (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-dark-50">
                  <Lock size={16} />
                  Şifre Değiştir
                </h3>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yeni şifre (min 6 karakter)"
                    className="flex-1 rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={!newPassword || newPassword.length < 6}
                    className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    Değiştir
                  </button>
                </div>
                <p className="mt-1 text-xs text-dark-400">Yeni şifre en az 6 karakter olmalıdır.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-dark-100 px-6 py-4 dark:border-dark-700">
          <button
            onClick={onClose}
            className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50 dark:border-dark-600 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            İptal
          </button>
          <button
            onClick={handleSaveProfile}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
