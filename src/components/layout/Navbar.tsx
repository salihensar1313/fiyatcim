"use client";

import { useState } from "react";
import { X } from "lucide-react";

function WhatsAppIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 175.216 175.552"
      fill="white"
    >
      <path d="M87.184 14.2c-40.392 0-73.266 32.874-73.282 73.27-.006 12.903 3.376 25.508 9.8 36.608L14.2 161.352l37.92-9.948a73.043 73.043 0 0 0 34.996 8.932h.032c40.38 0 73.262-32.882 73.27-73.28.008-19.578-7.6-37.984-21.42-51.82C124.998 21.804 106.59 14.2 87.184 14.2zm0 134.076h-.024a60.71 60.71 0 0 1-30.944-8.478l-2.22-1.318-23.018 6.04 6.144-22.442-1.446-2.3a60.86 60.86 0 0 1-9.332-32.504c.014-33.594 27.36-60.938 60.97-60.938 16.278.006 31.584 6.344 43.088 17.858 11.504 11.516 17.836 26.826 17.83 43.108-.016 33.598-27.362 60.944-60.962 60.944l-.086.03z" />
      <path d="M126.826 100.64c-2.174-1.088-12.864-6.35-14.86-7.076-1.992-.726-3.442-1.088-4.892 1.09-1.45 2.178-5.618 7.076-6.888 8.528-1.268 1.45-2.538 1.632-4.712.544-2.174-1.088-9.18-3.384-17.49-10.79-6.464-5.762-10.826-12.876-12.094-15.05-1.268-2.18-.136-3.358 .954-4.442.978-.974 2.174-2.54 3.262-3.81 1.088-1.27 1.45-2.178 2.174-3.63.726-1.45.364-2.72-.18-3.808-.544-1.088-4.892-11.788-6.704-16.146-1.764-4.24-3.556-3.666-4.892-3.732-1.268-.06-2.718-.074-4.168-.074s-3.806.544-5.8 2.718c-1.994 2.18-7.614 7.442-7.614 18.142 0 10.7 7.796 21.036 8.882 22.486 1.088 1.45 15.34 23.422 37.162 32.84 5.19 2.244 9.24 3.584 12.398 4.588 5.21 1.652 9.952 1.42 13.7 .86 4.18-.624 12.864-5.258 14.676-10.334 1.812-5.076 1.812-9.43 1.268-10.334-.544-.906-1.994-1.45-4.168-2.54z" />
    </svg>
  );
}

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  const whatsappNumber = "905001234567"; // Demo numara
  const message = encodeURIComponent("Merhaba, ürünleriniz hakkında bilgi almak istiyorum.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <>
      {/* Tooltip */}
      {showTooltip && (
        <div className="fixed bottom-[140px] right-6 z-40 flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-xl border border-dark-100 animate-fade-in lg:bottom-24">
          <p className="text-sm font-medium text-dark-700">Size nasıl yardımcı olabiliriz?</p>
          <button onClick={() => setShowTooltip(false)} className="text-dark-400 hover:text-dark-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="fixed bottom-20 right-6 z-40 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl lg:bottom-6"
        aria-label="WhatsApp ile iletişime geç"
      >
        <WhatsAppIcon size={32} />
      </a>

      {/* Pulse animation */}
      <span className="fixed bottom-20 right-6 z-30 h-[60px] w-[60px] animate-ping rounded-full bg-[#25D366]/30 pointer-events-none lg:bottom-6" />
    </>
  );
}
