"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

const icons = {
  success: <CheckCircle size={20} className="text-green-500 shrink-0" />,
  error: <AlertCircle size={20} className="text-red-500 shrink-0" />,
  info: <Info size={20} className="text-blue-500 shrink-0" />,
};

const bgColors = {
  success: "bg-white border-green-300 dark:bg-dark-800 dark:border-green-600",
  error: "bg-white border-red-300 dark:bg-dark-800 dark:border-red-600",
  info: "bg-white border-blue-300 dark:bg-dark-800 dark:border-blue-600",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      // Max 3 toasts — remove oldest if exceeded (FIFO)
      if (next.length > 3) return next.slice(next.length - 3);
      return next;
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl transition-all animate-in slide-in-from-right",
              bgColors[toast.type]
            )}
          >
            {icons[toast.type]}
            <span className="text-sm font-medium text-dark-800 dark:text-dark-100">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-dark-400 hover:text-dark-600 dark:text-dark-300"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
