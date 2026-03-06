"use client";

import { useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/constants";

const WHATSAPP_NUMBER = CONTACT.phone.replace(/[^0-9+]/g, "") || "905551234567";
const DEFAULT_MESSAGE = "Merhaba, Fiyatcim.com üzerinden bilgi almak istiyorum.";

export default function WhatsAppWidget() {
  const [showPopup, setShowPopup] = useState(false);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <div className="fixed bottom-20 right-4 z-50 sm:bottom-6">
      {/* Popup */}
      {showPopup && (
        <div className="mb-3 w-72 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-dark-100">
          {/* Header */}
          <div className="bg-[#075e54] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Fiyatcim.com</p>
                  <p className="text-xs text-green-200">Genellikle hızlı yanıt verir</p>
                </div>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat area */}
          <div className="bg-[#e5ddd5] px-4 py-4">
            <div className="max-w-[85%] rounded-lg bg-white p-3 shadow-sm">
              <p className="text-sm text-dark-700">
                Merhaba! Size nasıl yardımcı olabiliriz? Ürünler, kurulum veya teknik destek hakkında sorularınızı bekliyoruz.
              </p>
              <p className="mt-1 text-right text-[10px] text-dark-400">
                {new Date().getHours().toString().padStart(2, "0")}:
                {new Date().getMinutes().toString().padStart(2, "0")}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="p-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#20bd5a]"
            >
              <MessageCircle size={18} />
              Sohbeti Başlat
            </a>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] shadow-lg transition-all hover:scale-105 hover:bg-[#20bd5a] hover:shadow-xl"
        aria-label="WhatsApp ile iletişime geçin"
      >
        {showPopup ? (
          <X size={24} className="text-white" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )}
      </button>

      {/* Pulse animation */}
      {!showPopup && (
        <span className="absolute bottom-0 right-0 -z-10 h-14 w-14 animate-ping rounded-full bg-[#25d366]/40" />
      )}
    </div>
  );
}
