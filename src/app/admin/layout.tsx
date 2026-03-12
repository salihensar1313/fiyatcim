"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSearchCommand from "@/components/admin/AdminSearchCommand";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // GATE 1: Hydration-safe redirect — render body'de router.push YASAK
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push("/giris");
    }
  }, [isLoading, user, isAdmin, router]);

  // Loading veya yetkisiz → admin UI ASLA render edilmeyecek
  if (isLoading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dark-50 dark:bg-dark-800">
        <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-64">
          <AdminHeader onMenuToggle={() => setSidebarOpen(true)} />
          <main className="p-4 lg:p-6">{children}</main>
          <AdminSearchCommand />
        </div>
      </div>
  );
}
