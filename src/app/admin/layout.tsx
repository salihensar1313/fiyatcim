"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();

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
    <>
      {/* GATE 2: Admin sayfaları indexlenmemeli — "use client" layout'ta metadata export çalışmaz */}
      <meta name="robots" content="noindex,nofollow" />
      <div className="flex min-h-screen bg-dark-50">
        <AdminSidebar />
        <div className="ml-64 flex-1">
          <AdminHeader />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
