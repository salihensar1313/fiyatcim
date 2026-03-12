"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, Download, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { getCategories, getBrands } from "@/lib/queries";
import type { Category, Brand, Product } from "@/types";
import { formatPrice, formatUSD, getStockStatus } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useProducts } from "@/context/ProductContext";
import { useActivityLog } from "@/context/ActivityLogContext";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";
const ProductFormModal = dynamic(() => import("@/components/admin/ProductFormModal"), { ssr: false });
const ConfirmModal = dynamic(() => import("@/components/ui/ConfirmModal"), { ssr: false });
import { exportCSV } from "@/lib/csv";

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { addLog } = useActivityLog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getBrands().then(setBrands).catch(console.error);
  }, []);
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = products.filter((p) => !p.deleted_at);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter((p) => p.category_id === categoryFilter);
    }

    if (brandFilter) {
      result = result.filter((p) => p.brand_id === brandFilter);
    }

    if (statusFilter === "active") {
      result = result.filter((p) => p.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((p) => !p.is_active);
    }

    return result;
  }, [products, search, categoryFilter, brandFilter, statusFilter]);

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleSave = (data: Omit<Product, "id" | "created_at">) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
      addLog("product_update", `"${data.name}" ürünü güncellendi`, "product", editingProduct.id);
      showToast("Ürün güncellendi", "success");
    } else {
      addProduct(data);
      addLog("product_create", `"${data.name}" ürünü eklendi`, "product");
      showToast("Yeni ürün eklendi", "success");
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      addLog("product_delete", `"${deleteTarget.name}" ürünü silindi`, "product", deleteTarget.id);
      deleteProduct(deleteTarget.id);
      showToast("Ürün silindi", "info");
      setDeleteTarget(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => {
      const p = products.find((pr) => pr.id === id);
      if (p) {
        deleteProduct(id);
        addLog("product_delete", `"${p.name}" ürünü toplu silme ile silindi`, "product", id);
      }
    });
    showToast(`${selectedIds.size} ürün silindi`, "info");
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const handleExportCSV = () => {
    exportCSV({
      filename: `fiyatcim-urunler-${new Date().toISOString().slice(0, 10)}.csv`,
      headers: ["ID", "Ad", "SKU", "Kategori", "Marka", "Fiyat (₺)", "İndirimli Fiyat (₺)", "Fiyat ($)", "İndirimli Fiyat ($)", "Stok", "Durum"],
      rows: filtered.map((p) => [
        p.id,
        p.name,
        p.sku,
        categories.find((c) => c.id === p.category_id)?.name || "",
        brands.find((b) => b.id === p.brand_id)?.name || "",
        p.price,
        p.sale_price,
        p.price_usd,
        p.sale_price_usd,
        p.stock,
        p.is_active ? "Aktif" : "Pasif",
      ]),
    });
    showToast("CSV dosyası indirildi", "success");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Ürünler</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">{filtered.length} ürün</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-dark-200 px-3 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200 dark:hover:bg-dark-600"
          >
            <Download size={16} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 sm:px-4"
          >
            <Plus size={16} />
            Yeni Ürün
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20 p-3">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {selectedIds.size} ürün seçildi
          </span>
          <button
            onClick={() => setBulkDeleteOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <Trash2 size={14} />
            Toplu Sil
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs font-medium text-dark-500 hover:text-dark-700 dark:text-dark-400"
          >
            Seçimi Temizle
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Ürün adı veya SKU ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-dark-200 bg-white py-2 pl-9 pr-3 text-sm text-dark-900 focus:border-primary-600 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-400"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 focus:border-primary-600 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 focus:border-primary-600 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
        >
          <option value="">Tüm Markalar</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "active" | "inactive")}
          className="rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 focus:border-primary-600 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-100 bg-dark-50 dark:border-dark-700 dark:bg-dark-900">
              <tr>
                <th className="w-10 px-3 py-3">
                  <button onClick={toggleSelectAll} className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-200">
                    {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Ürün</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">SKU</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Kategori</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Marka</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Fiyat</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Stok</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Durum</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50 dark:divide-dark-700">
              {filtered.map((product) => {
                const cat = categories.find((c) => c.id === product.category_id);
                const brand = brands.find((b) => b.id === product.brand_id);
                const stock = getStockStatus(product.stock, product.critical_stock);

                return (
                  <tr key={product.id} className="hover:bg-dark-50/50 dark:hover:bg-dark-700/50">
                    <td className="w-10 px-3 py-3">
                      <button onClick={() => toggleSelect(product.id)} className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-200">
                        {selectedIds.has(product.id) ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate font-medium text-dark-900 dark:text-dark-50">{product.name}</p>
                    </td>
                    <td className="px-4 py-3 text-dark-500 dark:text-dark-300">{product.sku}</td>
                    <td className="px-4 py-3 text-dark-500 dark:text-dark-300">{cat?.name}</td>
                    <td className="px-4 py-3 text-dark-500 dark:text-dark-300">{brand?.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-dark-900 dark:text-dark-50">
                          {formatUSD(product.sale_price_usd || product.price_usd)}
                        </span>
                        <span className="text-xs text-primary-600">
                          {formatPrice(product.sale_price || product.price)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${stock.color}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.is_active ? "green" : "gray"}>
                        {product.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/urunler/${product.slug}`}
                          className="rounded p-1.5 text-dark-400 hover:bg-dark-100 hover:text-dark-600 dark:text-dark-300"
                          title="Görüntüle"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => handleEdit(product)}
                          className="rounded p-1.5 text-dark-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                          title="Düzenle"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="rounded p-1.5 text-dark-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
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

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-dark-500 dark:text-dark-400">Ürün bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        product={editingProduct}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Ürünü Sil"
        message={`"${deleteTarget?.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk Delete Confirm Modal */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        title="Toplu Ürün Silme"
        message={`${selectedIds.size} ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel={`${selectedIds.size} Ürünü Sil`}
        cancelLabel="İptal"
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
