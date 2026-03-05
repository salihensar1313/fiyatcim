"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const settings = useSettings();

  if (!isVisible) return null;

  const threshold = settings.freeShippingThreshold.toLocaleString("tr-TR");

  return (
    <div className="relative bg-primary-600 px-4 py-2 text-center text-sm text-white">
      <div className="container-custom flex items-center justify-center gap-2">
        <span>
          <strong>Ucretsiz Kargo:</strong> {threshold}&#8378; Uzeri Alisverislerde |{" "}
          <strong>7/24</strong> Teknik Destek
        </span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/80 transition-colors hover:text-white"
        aria-label="Kapat"
      >
        <X size={16} />
      </button>
    </div>
  );
}
