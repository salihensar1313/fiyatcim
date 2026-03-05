"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Product, Category, Brand } from "@/types";
import { getCategories, getBrands } from "@/lib/queries";

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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-100 px-6 py-4">
          <h2 className="text-lg font-bold text-dark-900">
            {product ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-dark-400 hover:bg-dark-50">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* Name & SKU */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Ürün Adı *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  errors.name ? "border-red-300 focus:border-red-500" : "border-dark-200 focus:border-primary-600"
                }`}
                placeholder="Ürün adını girin"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">SKU *</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  errors.sku ? "border-red-300 focus:border-red-500" : "border-dark-200 focus:border-primary-600"
                }`}
                placeholder="SKU-001"
              />
              {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm text-dark-500 focus:border-primary-600 focus:outline-none"
            />
          </div>

          {/* Category & Brand */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Kategori</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Marka</label>
              <select
                value={form.brand_id}
                onChange={(e) => setForm((prev) => ({ ...prev, brand_id: e.target.value }))}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Fiyat ($) *</label>
              <input
                type="number"
                value={form.price_usd || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, price_usd: Number(e.target.value) }))}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  errors.price_usd ? "border-red-300 focus:border-red-500" : "border-dark-200 focus:border-primary-600"
                }`}
                min={0}
                step={1}
              />
              {errors.price_usd && <p className="mt-1 text-xs text-red-500">{errors.price_usd}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">İndirimli Fiyat ($)</label>
              <input
                type="number"
                value={form.sale_price_usd ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sale_price_usd: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                min={0}
                step={1}
                placeholder="Opsiyonel"
              />
            </div>
          </div>

          {/* TL Price & Sale Price & Stock */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Fiyat (₺) *</label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  errors.price ? "border-red-300 focus:border-red-500" : "border-dark-200 focus:border-primary-600"
                }`}
                min={0}
                step={0.01}
              />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">İndirimli Fiyat (₺)</label>
              <input
                type="number"
                value={form.sale_price ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sale_price: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                min={0}
                step={0.01}
                placeholder="Opsiyonel"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Stok *</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  errors.stock ? "border-red-300 focus:border-red-500" : "border-dark-200 focus:border-primary-600"
                }`}
                min={0}
              />
              {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock}</p>}
            </div>
          </div>

          {/* Warranty, Shipping, Status */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Garanti (ay)</label>
              <input
                type="number"
                value={form.warranty_months}
                onChange={(e) => setForm((prev) => ({ ...prev, warranty_months: Number(e.target.value) }))}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Teslimat</label>
              <select
                value={form.shipping_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shipping_type: e.target.value as "kargo" | "kurulum" }))
                }
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
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
                <span className="text-sm font-medium text-dark-700">Aktif</span>
              </label>
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700">Kısa Açıklama</label>
            <input
              type="text"
              value={form.short_desc}
              onChange={(e) => setForm((prev) => ({ ...prev, short_desc: e.target.value }))}
              className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              placeholder="Kısa ürün açıklaması"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700">Detaylı Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              placeholder="Detaylı ürün açıklaması"
            />
          </div>

          {/* Specs */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700">Teknik Özellikler</label>
            {Object.entries(form.specs).length > 0 && (
              <div className="mb-2 space-y-1">
                {Object.entries(form.specs).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 rounded bg-dark-50 px-3 py-1.5 text-sm">
                    <span className="font-medium text-dark-700">{key}:</span>
                    <span className="text-dark-500">{value}</span>
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
            <div className="flex gap-2">
              <input
                type="text"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                placeholder="Özellik adı"
                className="flex-1 rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                placeholder="Değer"
                className="flex-1 rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
              <button
                onClick={addSpec}
                className="rounded-lg bg-dark-100 px-3 py-2 text-sm font-medium text-dark-700 hover:bg-dark-200"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-dark-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50"
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
