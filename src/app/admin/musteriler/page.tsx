"use client";

import { useState, useEffect } from "react";
import { Users, Download } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { safeGetJSON } from "@/lib/safe-storage";
import { exportCSV } from "@/lib/csv";
import type { Profile } from "@/types";

/**
 * Müşteriler — Demo
 * Kayıt olan kullanıcılar AuthContext'te localStorage'da tutulur.
 * Bu sayfa localStorage'daki kayıtlı profilleri okur ve listeler.
 * Sprint 3'te Supabase Auth ile entegre edilecek.
 */
export default function AdminCustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<(Profile & { email?: string })[]>([]);

  useEffect(() => {
    // AuthContext'in localStorage key'inden kullanıcıları oku
    const users = safeGetJSON<(Profile & { email?: string })[]>("fiyatcim_registered_users", []);
    const valid = Array.isArray(users)
      ? users.filter((u): u is Profile & { email?: string } =>
          typeof u === "object" && u !== null && "user_id" in u
        )
      : [];
    setCustomers(valid);
  }, []);

  const handleExportCSV = () => {
    exportCSV({
      filename: `fiyatcim-musteriler-${new Date().toISOString().slice(0, 10)}.csv`,
      headers: ["ID", "Ad", "Soyad", "E-posta", "Telefon", "Rol", "Kayıt Tarihi"],
      rows: customers.map((c) => [
        c.user_id,
        c.ad,
        c.soyad,
        c.email || "",
        c.telefon,
        c.role,
        c.created_at || "",
      ]),
    });
    showToast("CSV dosyası indirildi", "success");
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
          <p className="mt-2 text-sm text-dark-500">
            Kayıt sayfasından kayıt olan müşteriler burada listelenecek.
          </p>
          <p className="mt-1 text-xs text-dark-400">
            Sprint 3&apos;te Supabase Auth ile tam entegrasyon yapılacak.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
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

      <div className="overflow-hidden rounded-xl border border-dark-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-100 bg-dark-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-dark-700">Ad Soyad</th>
                <th className="px-4 py-3 font-semibold text-dark-700">E-posta</th>
                <th className="px-4 py-3 font-semibold text-dark-700">Telefon</th>
                <th className="px-4 py-3 font-semibold text-dark-700">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50">
              {customers.map((customer) => (
                <tr key={customer.user_id} className="hover:bg-dark-50/50">
                  <td className="px-4 py-3 font-medium text-dark-900">
                    {customer.ad} {customer.soyad}
                  </td>
                  <td className="px-4 py-3 text-dark-500">{customer.email || "-"}</td>
                  <td className="px-4 py-3 text-dark-500">{customer.telefon || "-"}</td>
                  <td className="px-4 py-3 text-dark-500">
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString("tr-TR")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
