"use client";

import { usePathname } from "next/navigation";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatBot from "@/components/ui/ChatBot";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import ScrollToTop from "@/components/ui/ScrollToTop";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
      >
        İçeriğe geç
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <ChatBot />
      <MobileBottomNav />
      <ScrollToTop />
    </>
  );
}
