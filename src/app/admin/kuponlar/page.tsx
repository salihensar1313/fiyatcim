"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Tag, Download } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useCoupons } from "@/context/CouponContext";
import { useToast } from "@/components/ui/Toast";
import { exportCSV } from "@/lib/csv";
import dynamic from "next/dynamic";
import type { Coupon } from "@/types";

const ConfirmModal = dynamic(() => import("@/components/ui/ConfirmModal"), { ssr: false });

export default function AdminCouponsPage() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useCoupons();
  const { showToast } = useToast();

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  // Form fields
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minCart, setMinCart] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiry, setExpiry] = useState("");
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setCode("");
    setType("percent");
    setValue("");
    setMinCart("");
    setMaxUses("");
    setExpiry("");
    setActive(true);
    setEditing(null);
    setFormOpen(false);
  };

  const openNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(String(coupon.value));
    setMinCart(String(coupon.min_cart));
    setMaxUses(coupon.max_uses !== null ? String(coupon.max_uses) : "");
    setExpiry(coupon.expiry ? coupon.expiry.slice(0, 10) : "");
    setActive(coupon.active);
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!code.trim()) {
      showToast("Kupon kodu zorunludur", "error");
      return;
    }
    if (!value || Number(value) <= 0) {
      showToast("İndirim değeri geçersiz", "error");
      return;
    }

    const couponData = {
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      min_cart: Number(minCart) || 0,
      max_uses: maxUses ? Number(maxUses) : null,
      active,
      expiry: expiry ? new Date(expiry).toISOString() : null,
    };

    if (editing) {
      updateCoupon(editing.id, couponData);
      showToast("Kupon güncellendi", "success");
    } else {
      addCoupon(couponData);
      showToast("Yeni kupon eklendi", "success");
    }
    resetForm();
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCoupon(deleteTarget.id);
      showToast("Kupon silindi", "info");
      setDeleteTarget(null);
    }
  };

  const handleExportCSV = () => {
    exportCSV({
      filename: `fiyatcim-kuponlar-${new Date().toISOString().slice(0, 10)}.csv`,
      headers: ["Kod", "Tür", "Değer", "Min Sepet", "Maks Kullanım", "Kullanılan", "Durum", "Son Tarih"],
      rows: coupons.map((c) => [
        c.code,
        c.type === "percent" ? "Yüzde" : "Sabit",
        c.value,
        c.min_cart,
        c.max_uses,
        c.used_count,
        c.active ? "Aktif" : "Pasif",
        c.expiry ? new Date(c.expiry).toLocaleDateString("tr-TR") : "Süresiz",
      ]),
    });
    showToast("CSV dosyası indirildi", "success");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Kuponlar</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">{coupons.length} kupon</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:bg-dark-800"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus size={16} />
            Yeni Kupon
          </button>
        </div>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="mb-6 rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
          <h3 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">
            {editing ? "Kuponu Düzenle" : "Yeni Kupon"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Kupon Kodu *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm uppercase focus:border-primary-600 focus:outline-none"
                placeholder="HOSGELDIN"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">İndirim Türü</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "percent" | "fixed")}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              >
                <option value="percent">Yüzde (%)</option>
                <option value="fixed">Sabit Tutar (₺)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                Değer * {type === "percent" ? "(%)" : "(₺)"}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                min="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Min. Sepet Tutarı (₺)</label>
              <input
                type="number"
                value={minCart}
                onChange={(e) => setMinCart(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                min="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Maks. Kullanım</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                min="0"
                placeholder="Sınırsız"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Son Kullanım Tarihi</label>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="coupon-active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="coupon-active" className="text-sm font-medium text-dark-700 dark:text-dark-200">Aktif</label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={resetForm} className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:bg-dark-800">
              İptal
            </button>
            <button onClick={handleSave} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              {editing ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-100 bg-dark-50 dark:bg-dark-800">
              <tr>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Kod</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">İndirim</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Min. Sepet</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Kullanım</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Son Tarih</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Durum</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50">
              {coupons.map((coupon) => {
                const isExpired = coupon.expiry && new Date(coupon.expiry) < new Date();
                const isExhausted = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;

                return (
                  <tr key={coupon.id} className="hover:bg-dark-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-primary-600" />
                        <span className="font-mono font-bold text-dark-900 dark:text-dark-50">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-700 dark:text-dark-200">
                      {coupon.type === "percent" ? `%${coupon.value}` : `${coupon.value}₺`}
                    </td>
                    <td className="px-4 py-3 text-dark-500 dark:text-dark-400">
                      {coupon.min_cart > 0 ? `${coupon.min_cart}₺` : "-"}
                    </td>
                    <td className="px-4 py-3 text-dark-500 dark:text-dark-400">
                      {coupon.used_count}{coupon.max_uses !== null ? ` / ${coupon.max_uses}` : " / ∞"}
                    </td>
                    <td className="px-4 py-3 text-dark-500 dark:text-dark-400">
                      {coupon.expiry
                        ? new Date(coupon.expiry).toLocaleDateString("tr-TR")
                        : "Süresiz"}
                    </td>
                    <td className="px-4 py-3">
                      {!coupon.active ? (
                        <Badge variant="gray">Pasif</Badge>
                      ) : isExpired ? (
                        <Badge variant="red">Süresi Dolmuş</Badge>
                      ) : isExhausted ? (
                        <Badge variant="yellow">Limit Doldu</Badge>
                      ) : (
                        <Badge variant="green">Aktif</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="rounded p-1.5 text-dark-400 hover:bg-blue-50 dark:bg-blue-900/30 hover:text-blue-600"
                          title="Düzenle"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(coupon)}
                          className="rounded p-1.5 text-dark-400 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-600"
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {coupons.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-dark-500 dark:text-dark-400">Henüz kupon yok.</p>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal — GATE 5 */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Kuponu Sil"
        message={`"${deleteTarget?.code}" kuponunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
