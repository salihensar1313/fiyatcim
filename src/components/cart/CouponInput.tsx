"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CouponInput() {
  const { couponCode, setCouponCode, setDiscount } = useCart();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = () => {
    if (!input.trim()) {
      setError("Kupon kodu giriniz.");
      return;
    }

    setLoading(true);
    setError("");

    // Demo: hardcoded kupon kontrolü (gerçekte Supabase'den gelecek)
    setTimeout(() => {
      const code = input.trim().toUpperCase();
      if (code === "FIYATCIM10") {
        setCouponCode(code);
        setDiscount(100); // 100₺ sabit indirim demo
        setError("");
      } else if (code === "HOSGELDIN") {
        setCouponCode(code);
        setDiscount(50);
        setError("");
      } else {
        setError("Geçersiz veya süresi dolmuş kupon kodu.");
      }
      setLoading(false);
    }, 500);
  };

  const handleRemove = () => {
    setCouponCode(null);
    setDiscount(0);
    setInput("");
    setError("");
  };

  if (couponCode) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-green-600" />
          <span className="text-sm font-medium text-green-700">{couponCode}</span>
        </div>
        <button onClick={handleRemove} className="text-green-600 hover:text-green-800">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Kupon kodu"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="flex-1 rounded-lg border border-dark-200 px-3 py-2 text-sm uppercase focus:border-primary-600 focus:outline-none"
        />
        <button
          onClick={handleApply}
          disabled={loading}
          className="rounded-lg bg-dark-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-800 disabled:opacity-50"
        >
          {loading ? "..." : "Uygula"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
