"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Product, Category, Brand } from "@/types";
import { getCategories, getBrands } from "@/lib/queries";
import { ADMIN_INPUT, ADMIN_SELECT, ADMIN_TEXTAREA } from "@/lib/admin-classes";
import { useCurrency } from "@/context/CurrencyContext";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Product, "id" | "created_at">) => void;
  product?: Product | null;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const defaultFormData = {
  name: "",
  slug: "",
  sku: "",
  category_id: "cat-1",
  brand_id: "brand-1",
  price: 0,
  sale_price: null as number | null,
  price_usd: 0,
  sale_price_usd: null as number | null,
  stock: 0,
  critical_stock: 5,
  tax_rate: 20,
  warranty_months: 24,
  shipping_type: "kargo" as "kargo" | "kurulum",
  is_active: true,
  deleted_at: null as string | null,
  short_desc: "",
  description: "",
  specs: {} as Record<string, string>,
  images: [] as string[],
  seo_title: "",
  seo_desc: "",
};

export default function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  product,
}: ProductFormModalProps) {
  const [form, setForm] = useState(defaultFormData);
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const { usdToTry } = useCurrency();
  const [tlAutoCalc, setTlAutoCalc] = useState(true);
  const focusTrapRef = useFocusTrap<HTMLDivElement>();

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getBrands().then(setBrands).catch(console.error);
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        category_id: product.category_id,
        brand_id: product.brand_id,
        price: product.price,
        sale_price: product.sale_price,
        price_usd: product.price_usd,
        sale_price_usd: product.sale_price_usd,
        stock: product.stock,
        critical_stock: product.critical_stock,
        tax_rate: product.tax_rate,
        warranty_months: product.warranty_months,
        shipping_type: product.shipping_type,
        is_active: product.is_active,
        deleted_at: product.deleted_at,
        short_desc: product.short_desc,
        description: product.description,
        specs: { ...product.specs },
        images: [...product.images],
        seo_title: product.seo_title,
        seo_desc: product.seo_desc,
      });
    } else {
      setForm(defaultFormData);
    }
    setErrors({});
  }, [product, isOpen]);

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: product ? prev.slug : generateSlug(value),
    }));
  };

  const addSpec = () => {
    if (specKey.trim() && specValue.trim()) {
      setForm((prev) => ({
        ...prev,
        specs: { ...prev.specs, [specKey.trim()]: specValue.trim() },
      }));
      setSpecKey("");
      setSpecValue("");
    }
  };

  const removeSpec = (key: string) => {
    setForm((prev) => {
      const newSpecs = { ...prev.specs };
      delete newSpecs[key];
      return { ...prev, specs: newSpecs };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Ürün adı zorunlu";
    if (!form.sku.trim()) newErrors.sku = "SKU zorunlu";
    if (form.price <= 0) newErrors.price = "Fiyat 0'dan büyük olmalı";
    if (form.price_usd <= 0) newErrors.price_usd = "USD fiyat 0'dan büyük olmalı";
    if (form.stock < 0) newErrors.stock = "Stok negatif olamaz";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = (field?: string) =>
    `${ADMIN_INPUT} ${field && errors[field] ? "!border-red-400 !focus:border-red-500 dark:!border-red-500" : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 pt-4 sm:p-4 sm:pt-8">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div ref={focusTrapRef} className="relative mx-auto w-full max-w-[calc(100vw-1rem)] rounded-xl bg-white shadow-xl dark:bg-dark-800 sm:max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-100 px-4 py-3 dark:border-dark-700 sm:px-6 sm:py-4">
          <h2 className="text-base font-bold text-dark-900 dark:text-dark-50 sm:text-lg">
            {product ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-700">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="max-h-[75vh] space-y-4 overflow-y-auto px-4 py-4 sm:max-h-[70vh] sm:space-y-5 sm:px-6 sm:py-5">
          {/* Name & SKU */}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Ürün Adı *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass("name")}
                placeholder="Ürün adını girin"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">SKU *</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                className={inputClass("sku")}
                placeholder="SKU-001"
              />
              {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className={ADMIN_INPUT}
            />
          </div>

          {/* Category & Brand */}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Kategori</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                className={`${ADMIN_SELECT} w-full`}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Marka</label>
              <select
                value={form.brand_id}
                onChange={(e) => setForm((prev) => ({ ...prev, brand_id: e.target.value }))}
                className={`${ADMIN_SELECT} w-full`}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* USD Price & Sale Price */}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Fiyat ($) *</label>
              <input
                type="number"
                value={form.price_usd || ""}
                onChange={(e) => {
                  const usd = Number(e.target.value);
                  setForm((prev) => ({
                    ...prev,
                    price_usd: usd,
                    ...(tlAutoCalc && usd > 0 ? { price: Math.round(usdToTry(usd)) } : {}),
                  }));
                }}
                className={inputClass("price_usd")}
                min={0}
                step={1}
              />
              {errors.price_usd && <p className="mt-1 text-xs text-red-500">{errors.price_usd}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">İndirimli Fiyat ($)</label>
              <input
                type="number"
                value={form.sale_price_usd ?? ""}
                onChange={(e) => {
                  const usd = e.target.value ? Number(e.target.value) : null;
                  setForm((prev) => ({
                    ...prev,
                    sale_price_usd: usd,
                    ...(tlAutoCalc && usd != null && usd > 0 ? { sale_price: Math.round(usdToTry(usd)) } : {}),
                    ...(tlAutoCalc && usd == null ? { sale_price: null } : {}),
                  }));
                }}
                className={ADMIN_INPUT}
                min={0}
                step={1}
                placeholder="Opsiyonel"
              />
            </div>
          </div>

          {/* TL Price & Sale Price & Stock */}
          <div className="mb-1 flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={tlAutoCalc}
                onChange={(e) => setTlAutoCalc(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-primary-600"
              />
              <span className="text-xs text-dark-500 dark:text-dark-400">TL fiyatları USD&apos;den otomatik hesapla</span>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                Fiyat (₺) *{tlAutoCalc && <span className="ml-1 text-xs font-normal text-dark-400">(otomatik)</span>}
              </label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => {
                  setTlAutoCalc(false);
                  setForm((prev) => ({ ...prev, price: Number(e.target.value) }));
                }}
                className={inputClass("price")}
                min={0}
                step={0.01}
              />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                İndirimli Fiyat (₺){tlAutoCalc && <span className="ml-1 text-xs font-normal text-dark-400">(otomatik)</span>}
              </label>
              <input
                type="number"
                value={form.sale_price ?? ""}
                onChange={(e) => {
                  setTlAutoCalc(false);
                  setForm((prev) => ({
                    ...prev,
                    sale_price: e.target.value ? Number(e.target.value) : null,
                  }));
                }}
                className={ADMIN_INPUT}
                min={0}
                step={0.01}
                placeholder="Opsiyonel"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Stok *</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                className={inputClass("stock")}
                min={0}
              />
              {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock}</p>}
            </div>
          </div>

          {/* Warranty, Shipping, Status */}
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Garanti (ay)</label>
              <input
                type="number"
                value={form.warranty_months}
                onChange={(e) => setForm((prev) => ({ ...prev, warranty_months: Number(e.target.value) }))}
                className={ADMIN_INPUT}
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Teslimat</label>
              <select
                value={form.shipping_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shipping_type: e.target.value as "kargo" | "kurulum" }))
                }
                className={`${ADMIN_SELECT} w-full`}
              >
                <option value="kargo">Kargo</option>
                <option value="kurulum">Kurulum</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded accent-primary-600"
                />
                <span className="text-sm font-medium text-dark-700 dark:text-dark-200">Aktif</span>
              </label>
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Kısa Açıklama</label>
            <input
              type="text"
              value={form.short_desc}
              onChange={(e) => setForm((prev) => ({ ...prev, short_desc: e.target.value }))}
              className={ADMIN_INPUT}
              placeholder="Kısa ürün açıklaması"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Detaylı Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              className={ADMIN_TEXTAREA}
              placeholder="Detaylı ürün açıklaması"
            />
          </div>

          {/* Specs */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Teknik Özellikler</label>
            {Object.entries(form.specs).length > 0 && (
              <div className="mb-2 space-y-1">
                {Object.entries(form.specs).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 rounded bg-dark-50 px-3 py-1.5 text-sm dark:bg-dark-700">
                    <span className="font-medium text-dark-700 dark:text-dark-200">{key}:</span>
                    <span className="text-dark-500 dark:text-dark-400">{value}</span>
                    <button
                      onClick={() => removeSpec(key)}
                      className="ml-auto text-dark-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                placeholder="Özellik adı"
                className={`${ADMIN_INPUT} sm:flex-1`}
              />
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                placeholder="Değer"
                className={`${ADMIN_INPUT} sm:flex-1`}
              />
              <button
                onClick={addSpec}
                className="rounded-lg bg-dark-100 px-3 py-2 text-sm font-medium text-dark-700 hover:bg-dark-200 dark:bg-dark-600 dark:text-dark-200 dark:hover:bg-dark-500"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-dark-100 px-4 py-3 dark:border-dark-700 sm:px-6 sm:py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50 dark:border-dark-600 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            {product ? "Güncelle" : "Ürün Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}
