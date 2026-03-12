"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useScrollLock(isOpen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Escape key + focus trap handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    // Focus trap: Tab key
    if (e.key === "Tab" && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    document.addEventListener("keydown", handleKeyDown);

    // Focus first focusable element in modal
    requestAnimationFrame(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previously focused element
      previousFocusRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title || "Modal"}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div ref={dialogRef} className={cn("relative w-full rounded-xl bg-white dark:bg-dark-800 p-6 shadow-xl", sizes[size])}>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-50">{title}</h3>
            <button onClick={onClose} aria-label="Kapat" className="rounded-lg p-2 text-dark-500 hover:bg-dark-50 hover:text-dark-600 dark:text-dark-300 dark:hover:bg-dark-700">
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button onClick={onClose} aria-label="Kapat" className="absolute right-4 top-4 rounded-lg p-2 text-dark-500 hover:bg-dark-50">
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
