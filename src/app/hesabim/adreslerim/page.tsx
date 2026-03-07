"use client";

import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAddresses } from "@/context/AddressContext";
import type { SavedAddress } from "@/types";
import { TURKISH_PROVINCES } from "@/lib/constants";

const ILLER = TURKISH_PROVINCES;

const EMPTY_FORM = {
  baslik: "",
  ad: "",
  soyad: "",
  telefon: "905",
  il: "",
  ilce: "",
  adres: "",
  posta_kodu: "",
};

export default function AddressesPage() {
  const { user } = useAuth();
  const { addresses, addAddress, updateAddress, removeAddress } = useAddresses();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const userAddresses = addresses.filter((a) => a.user_id === user?.id);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setForm({
      baslik: addr.baslik,
      ad: addr.ad,
      soyad: addr.soyad,
      telefon: addr.telefon || "905",
      il: addr.il,
      ilce: addr.ilce,
      adres: addr.adres,
      posta_kodu: addr.posta_kodu,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAttempted(false);
  };

  const isValid =
    form.baslik.trim() &&
    form.ad.trim() &&
    form.soyad.trim() &&
    form.telefon.length >= 12 &&
    form.il &&
    form.ilce.trim() &&
    form.adres.trim();

  const handleSave = () => {
    setAttempted(true);
    if (!isValid || !user) return;
    if (editingId) {
      updateAddress(editingId, form);
    } else {
      addAddress({ ...form, user_id: user.id });
    }
    closeForm();
  };

  const formatPhone = (raw: string) =>
    raw.replace(
      /(\d{2})(\d{3})(\d{0,3})(\d{0,2})(\d{0,2})/,
      (_m, a, b, c, d, e) => [a, b, c, d, e].filter(Boolean).join(" ")
    );

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, "");
    if (raw.length < 3 || !raw.startsWith("905")) return;
    if (raw.length <= 12) setForm({ ...form, telefon: raw });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Adreslerim</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Yeni Adres
        </button>
      </div>

      {userAddresses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {userAddresses.map((addr) => (
            <div
              key={addr.id}
              className="relative rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-dark-900 dark:text-dark-50">
                  <MapPin size={16} className="text-primary-600" />
                  {addr.baslik}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(addr)}
                    className="rounded-lg p-1.5 text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-700 hover:text-dark-700 dark:text-dark-200"
                    title="Düzenle"
                  >
                    <Pencil size={15} />
                  </button>
                  {deleteConfirm === addr.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { removeAddress(addr.id); setDeleteConfirm(null); }}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Sil
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-dark-500 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(addr.id)}
                      className="rounded-lg p-1.5 text-dark-400 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-600"
                      title="Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-dark-800 dark:text-dark-100">
                {addr.ad} {addr.soyad}
              </p>
              <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
                {addr.adres}
              </p>
              <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
                {addr.ilce} / {addr.il}
                {addr.posta_kodu && ` - ${addr.posta_kodu}`}
              </p>
              <p className="mt-1 text-sm text-dark-400">
                {formatPhone(addr.telefon)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 py-20">
          <MapPin size={56} className="mb-4 text-dark-200" />
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Kayıtlı Adresiniz Yok</h2>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
            Sipariş verirken kullanmak üzere adres ekleyebilirsiniz.
          </p>
          <button
            onClick={openNew}
            className="mt-4 flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus size={16} />
            Adres Ekle
          </button>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white dark:bg-dark-800 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">
                {editingId ? "Adresi Düzenle" : "Yeni Adres Ekle"}
              </h2>
              <button onClick={closeForm} className="rounded-lg p-1 text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-700 hover:text-dark-700 dark:text-dark-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Adres Başlığı */}
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                  Adres Başlığı <span className="text-primary-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ev, İş"
                  value={form.baslik}
                  onChange={(e) => setForm({ ...form, baslik: e.target.value })}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                />
              </div>

              {/* Ad Soyad */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                    Ad <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ad}
                    onChange={(e) => setForm({ ...form, ad: e.target.value })}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                    Soyad <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.soyad}
                    onChange={(e) => setForm({ ...form, soyad: e.target.value })}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                  Telefon <span className="text-primary-600">*</span>
                </label>
                <input
                  type="tel"
                  value={formatPhone(form.telefon)}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="90 5XX XXX XX XX"
                  inputMode="numeric"
                  maxLength={16}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                />
              </div>

              {/* İl / İlçe / Posta Kodu */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                    İl <span className="text-primary-600">*</span>
                  </label>
                  <select
                    value={form.il}
                    onChange={(e) => setForm({ ...form, il: e.target.value, ilce: "" })}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
                  >
                    <option value="">İl Seçin</option>
                    {ILLER.map((il) => (
                      <option key={il} value={il}>{il}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                    İlçe <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="İlçe yazın"
                    value={form.ilce}
                    onChange={(e) => setForm({ ...form, ilce: e.target.value })}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Posta Kodu</label>
                  <input
                    type="text"
                    value={form.posta_kodu}
                    onChange={(e) => setForm({ ...form, posta_kodu: e.target.value })}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>
              </div>

              {/* Adres */}
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                  Adres <span className="text-primary-600">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Mahalle, sokak, bina no, daire no..."
                  value={form.adres}
                  onChange={(e) => setForm({ ...form, adres: e.target.value })}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                />
              </div>

              {/* Validasyon mesajı */}
              {attempted && !isValid && (
                <p className="text-sm text-red-600">
                  Lütfen zorunlu (*) alanların tamamını doldurun.
                </p>
              )}

              {/* Butonlar */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeForm}
                  className="rounded-lg border border-dark-200 dark:border-dark-600 px-5 py-2.5 text-sm font-semibold text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
                >
                  {editingId ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
