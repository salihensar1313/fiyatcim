"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn("relative w-full rounded-xl bg-white p-6 shadow-xl", sizes[size])}>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
            <button onClick={onClose} className="rounded-lg p-1 text-dark-400 hover:bg-dark-50 hover:text-dark-600">
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-dark-400 hover:bg-dark-50">
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
