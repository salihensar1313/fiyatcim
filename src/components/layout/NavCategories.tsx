"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/types";
import { getCategories } from "@/lib/queries";
import { getCategoryIcon } from "@/lib/nav";

export default function NavCategories({ isPremium = false }: { isPremium?: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const megaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    return () => {
      if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    };
  }, []);

  const handleMegaEnter = useCallback((slug: string) => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    setActiveMega(slug);
  }, []);

  const handleMegaLeave = useCallback(() => {
    megaTimeoutRef.current = setTimeout(() => setActiveMega(null), 150);
  }, []);

  return (
    <>
      {categories.map((cat) => {
        const Icon = getCategoryIcon(cat.icon);
        const href = `/kategori/${cat.slug}`;
        const isActive = pathname.startsWith(href);

        return (
          <div
            key={cat.id}
            className="relative"
            onMouseEnter={() => handleMegaEnter(cat.slug)}
            onMouseLeave={handleMegaLeave}
          >
            <Link
              href={href}
              className={`flex items-center gap-1 px-4 py-3 text-sm font-semibold transition-colors ${
                isPremium
                  ? `hover:bg-amber-700 ${isActive ? "bg-amber-700 text-white" : "text-white"}`
                  : `hover:bg-primary-700 ${isActive ? "bg-primary-700 text-white" : "text-white"}`
              }`}
            >
              {cat.name}
              <ChevronDown
                size={14}
                className={`transition-transform ${activeMega === cat.slug ? "rotate-180" : ""}`}
              />
            </Link>

            {/* Dropdown */}
            {activeMega === cat.slug && (
              <div
                className="absolute left-0 top-full z-40 w-64 rounded-b-xl border border-t-0 border-dark-100 bg-white py-3 shadow-xl dark:border-dark-700 dark:bg-dark-800"
                onMouseEnter={() => handleMegaEnter(cat.slug)}
                onMouseLeave={handleMegaLeave}
              >
                <div className="mb-2 flex items-center gap-2 px-4">
                  <Icon size={18} className="text-primary-600" />
                  <Link
                    href={href}
                    className="text-sm font-bold text-dark-900 hover:text-primary-600 dark:text-dark-50"
                  >
                    Tümünü Gör
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
