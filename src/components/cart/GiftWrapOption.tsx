"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { GIFT_WRAP_COST } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

interface GiftWrapOptionProps {
  productId: string;
  isWrapped?: boolean;
  message?: string;
}

export default function GiftWrapOption({ productId, isWrapped, message }: GiftWrapOptionProps) {
  const { setGiftWrap } = useCart();
  const [showMessage, setShowMessage] = useState(!!message);
  const [giftMessage, setGiftMessage] = useState(message || "");

  const handleToggle = () => {
    if (isWrapped) {
      setGiftWrap(productId, false);
      setShowMessage(false);
      setGiftMessage("");
    } else {
      setGiftWrap(productId, true, giftMessage || undefined);
      setShowMessage(true);
    }
  };

  const handleMessageChange = (value: string) => {
    setGiftMessage(value);
    if (isWrapped) {
      setGiftWrap(productId, true, value || undefined);
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-dashed border-dark-200 p-3 dark:border-dark-600">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={!!isWrapped}
          onChange={handleToggle}
          className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
        />
        <Gift size={16} className={isWrapped ? "text-primary-600" : "text-dark-500"} />
        <span className="text-sm font-medium text-dark-700 dark:text-dark-200">
          Hediye Paketi
        </span>
        <span className="text-xs text-dark-500">
          (+{formatPrice(GIFT_WRAP_COST)})
        </span>
      </label>

      {isWrapped && showMessage && (
        <div className="mt-2">
          <textarea
            value={giftMessage}
            onChange={(e) => handleMessageChange(e.target.value)}
            placeholder="Hediye mesajınızı yazın (opsiyonel)..."
            maxLength={200}
            rows={2}
            className="input-field w-full resize-none text-sm"
          />
          <p className="mt-1 text-right text-xs text-dark-500">
            {giftMessage.length}/200
          </p>
        </div>
      )}
    </div>
  );
}
