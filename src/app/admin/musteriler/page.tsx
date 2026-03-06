"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Users, Download, Search, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { safeGetJSON } from "@/lib/safe-storage";
import { exportCSV } from "@/lib/csv";
import type { Profile } from "@/types";
import CustomerEditModal from "@/components/admin/CustomerEditModal";

type CustomerRow = Profile & { email?: string };

export default function AdminCustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);

  const loadCustomers = useCallback(() => {
    const users = safeGetJSON<CustomerRow[]>("fiyatcim_registered_users", []);
    const valid = Array.isArray(users)
      ? users.filter((u): u is CustomerRow => typeof u === "object" && u !== null && "user_id" in u)
      : [];
    setCustomers(valid);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.ad?.toLowerCase().includes(q) ||
        c.soyad?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telefon?.includes(q)
    );
  }, [customers, search]);

  const handleExportCSV = () => {
    exportCSV({
      filename: `fiyatcim-musteriler-${new Date().toISOString().slice(0, 10)}.csv`,
      headers: ["ID", "Ad", "Soyad", "E-posta", "Telefon", "Rol", "Kayıt Tarihi"],
      rows: customers.map((c) => [
        c.user_id, c.ad, c.soyad, c.email || "", c.telefon, c.role, c.created_at || "",
      ]),
    });
    showToast("CSV dosyası indirildi", "success");
  };

  const handleEditSaved = () => {
    setEditingCustomer(null);
    loadCustomers(); // Refresh table
  };

  if (customers.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark-900">Müşteriler</h1>
          <p className="text-sm text-dark-500">Kayıtlı müşteriler</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white py-20">
          <Users size={56} className="mb-4 text-dark-200" />
          <h2 className="text-lg font-bold text-dark-900">Henüz Kayıtlı Müşteri Yok</h2>
          <p className="mt-2 text-sm text-dark-500">Kayıt sayfasından kayıt olan müşteriler burada listelenecek.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Müşteriler</h1>
          <p className="text-sm text-dark-500">{customers.length} kayıtlı müşteri</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50"
        >
          <Download size={16} />
          CSV
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-dark-100 bg-white px-4 py-2">
        <Search size={16} className="text-dark-400" />
        <input
          type="text"
          placeholder="İsim, e-posta veya telefon ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-dark-400"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-dark-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-100 bg-dark-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-dark-700">Ad Soyad</th>
                <th className="hidden px-4 py-3 font-semibold text-dark-700 sm:table-cell">E-posta</th>
                <th className="px-4 py-3 font-semibold text-dark-700">Telefon</th>
                <th className="hidden px-4 py-3 font-semibold text-dark-700 md:table-cell">Kayıt Tarihi</th>
                <th className="px-4 py-3 text-right font-semibold text-dark-700">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50">
              {filtered.map((customer) => (
                <tr key={customer.user_id} className="hover:bg-dark-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-dark-900">{customer.ad} {customer.soyad}</div>
                    <div className="text-xs text-dark-400 sm:hidden">{customer.email || "-"}</div>
                  </td>
                  <td className="hidden px-4 py-3 text-dark-500 sm:table-cell">{customer.email || "-"}</td>
                  <td className="px-4 py-3 text-dark-500">{customer.telefon || "-"}</td>
                  <td className="hidden px-4 py-3 text-dark-500 md:table-cell">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString("tr-TR") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingCustomer(customer)}
                      className="rounded-lg p-2 text-dark-400 hover:bg-primary-50 hover:text-primary-600"
                      title="Düzenle"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-dark-400">
                    Aramayla eşleşen müşteri bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCustomer && (
        <CustomerEditModal
          customer={{
            user_id: editingCustomer.user_id,
            email: editingCustomer.email || "",
            ad: editingCustomer.ad,
            soyad: editingCustomer.soyad,
            telefon: editingCustomer.telefon,
            role: editingCustomer.role,
            created_at: editingCustomer.created_at || "",
          }}
          onClose={() => setEditingCustomer(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
