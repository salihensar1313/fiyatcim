"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import Image from "next/image";

interface FABProps {
  isOpen: boolean;
  unreadCount: number;
  onClick: () => void;
}

const FAB = React.memo(function FAB({ isOpen, unreadCount, onClick }: FABProps) {
  const fabRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0, moved: false });
  const [promoBubble, setPromoBubble] = useState(false);
  const promoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cimbot-fab-pos");
      if (saved) {
        const { x, y } = JSON.parse(saved);
        posRef.current = { x, y };
        if (fabRef.current) {
          fabRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
      }
    } catch {}
  }, []);

  // Promo bubble - 5 saniye sonra göster
  useEffect(() => {
    if (isOpen) return;
    promoTimerRef.current = setTimeout(() => {
      const dismissed = sessionStorage.getItem("cimbot-promo-dismissed");
      if (!dismissed) {
        setPromoBubble(true);
      }
    }, 5000);
    return () => { if (promoTimerRef.current) clearTimeout(promoTimerRef.current); };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setPromoBubble(false);
  }, [isOpen]);

  const dismissPromo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPromoBubble(false);
    sessionStorage.setItem("cimbot-promo-dismissed", "1");
  }, []);

  const snapToEdge = useCallback(() => {
    const fab = fabRef.current;
    if (!fab) return;
    const rect = fab.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const vw = window.innerWidth;
    const isLeft = centerX < vw / 2;
    const baseRight = vw - rect.width - 20;
    const targetX = isLeft ? -(baseRight - 20) : 0;
    posRef.current.x = targetX;
    fab.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    fab.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    setTimeout(() => { if (fab) fab.style.transition = ""; }, 300);
    try { localStorage.setItem("cimbot-fab-pos", JSON.stringify(posRef.current)); } catch {}
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragRef.current = { isDragging: true, startX: touch.clientX, startY: touch.clientY, startPosX: posRef.current.x, startPosY: posRef.current.y, moved: false };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;
    posRef.current.x = dragRef.current.startPosX + dx;
    posRef.current.y = dragRef.current.startPosY + dy;
    if (fabRef.current) fabRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    if (dragRef.current.moved) e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(() => {
    const wasDrag = dragRef.current.moved;
    dragRef.current.isDragging = false;
    if (wasDrag) snapToEdge(); else onClick();
  }, [onClick, snapToEdge]);

  if (isOpen) return null;

  return (
    <div
      ref={fabRef}
      className="fixed bottom-6 right-4 z-[55] hidden sm:block lg:bottom-8 lg:right-6"
      style={{ willChange: "transform", touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Promo mesaj balonu */}
      {promoBubble && (
        <div className="absolute bottom-[136px] right-0 mb-2 w-[240px] animate-bounce-in cursor-pointer rounded-xl bg-white px-4 py-3 shadow-xl ring-1 ring-dark-100 dark:bg-dark-800 dark:ring-dark-600 sm:bottom-[152px]">
          <button
            onClick={dismissPromo}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-dark-200 text-dark-500 shadow-sm transition-colors hover:bg-dark-300 dark:bg-dark-600 dark:text-dark-300"
            aria-label="Bildirimi kapat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div className="flex items-center gap-2" onClick={onClick}>
            <Image
              src="/images/cimbot.png"
              alt="CimBot"
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-dark-800 dark:text-dark-100">
              Bana t&#305;kla, sana yard&#305;m edeyim! &#128640;
            </span>
          </div>
        </div>
      )}

      {/* Ana CimBot butonu */}
      <button
        onClick={() => { if (!("ontouchstart" in window)) onClick(); }}
        className="group relative flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 h-32 w-32 sm:h-36 sm:w-36"
        aria-label="CimBot'u aç"
      >
        {/* Yeşil online noktası */}
        <span className="absolute right-3 top-5 h-4 w-4 rounded-full border-2 border-white bg-green-500" />

        {/* Ping animasyonu */}
        <span className="absolute bottom-0 right-0 -z-10 h-32 w-32 sm:h-36 sm:w-36 animate-ping rounded-full bg-primary-600/30" />

        {/* CimBot maskot */}
        <Image
          src="/images/cimbot.png"
          alt="CimBot"
          width={128}
          height={128}
          className="h-28 w-28 sm:h-32 sm:w-32 animate-cimbot-wave object-contain drop-shadow-lg"
          priority
        />

        {/* Mesaj bildirim badge */}
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
});

export default FAB;
