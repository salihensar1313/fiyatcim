"use client";

import { useEffect, useCallback } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Onayla",
  cancelLabel = "İptal",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useScrollLock(isOpen);

  // Escape key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-dark-800 p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isDanger ? "bg-red-100 dark:bg-red-950" : "bg-yellow-100 dark:bg-yellow-950"
            }`}
          >
            {isDanger ? (
              <Trash2 size={20} className="text-red-600" />
            ) : (
              <AlertTriangle size={20} className="text-yellow-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-50">{title}</h3>
            <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-dark-200 dark:border-dark-600 px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-200 transition-colors hover:bg-dark-50 dark:hover:bg-dark-700"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
