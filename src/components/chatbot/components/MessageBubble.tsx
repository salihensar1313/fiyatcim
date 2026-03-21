"use client";

import React from "react";
import Image from "next/image";
import type { ChatMessage } from "../types";
import ProductCarousel from "./ProductCarousel";
import QuickReplies from "./QuickReplies";

interface MessageBubbleProps {
  message: ChatMessage;
  isFirst: boolean; // first in a group from same sender
  isNew?: boolean;  // only animate when message is newly added
  onQuickReply: (value: string) => void;
  onAddToCart?: (productId: string) => void;
  onViewProduct?: (slug: string) => void;
  onAction?: (action: ChatMessage["actions"]) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

const MessageBubble = React.memo(function MessageBubble({
  message,
  isFirst,
  isNew = false,
  onQuickReply,
  onAddToCart,
  onViewProduct,
}: MessageBubbleProps) {
  const isBot = message.from === "bot";

  return (
    <div className={isNew ? "animate-in fade-in slide-in-from-bottom-3 duration-300" : ""}>
      <div className={`flex items-end gap-2 px-4 py-0.5 ${isBot ? "" : "flex-row-reverse"}`}>
        {/* Avatar — only on first message in group */}
        {isBot && (
          <div
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-600 ${
              isFirst ? "visible" : "invisible"
            }`}
          >
            <Image src="/images/cimbot-transparent.png" alt="CimBot" width={28} height={28} className="h-full w-full object-cover" />
          </div>
        )}

        {/* Bubble */}
        <div
          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
            isBot
              ? "rounded-bl-md bg-white text-gray-800 dark:bg-dark-700 dark:text-gray-100"
              : "rounded-br-md bg-primary-600 text-white"
          }`}
        >
          {/* Text with newline support */}
          {message.text.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}

          {/* Action buttons */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.actions.map((action, i) => (
                <a
                  key={i}
                  href={action.href || "#"}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    isBot
                      ? "bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  {...(action.type === "navigate" ? {} : {})}
                >
                  {action.icon === "phone" && "📞"}
                  {action.icon === "email" && "📧"}
                  {action.icon === "link" && "🔗"}
                  {action.icon === "cart" && "🛒"}
                  {action.icon === "search" && "🔍"}
                  {action.label}
                </a>
              ))}
            </div>
          )}

          {/* Timestamp + read status */}
          <div className={`mt-1 flex items-center gap-1 text-[10px] ${isBot ? "text-gray-400" : "text-white/60"}`}>
            <span>{formatTime(message.timestamp)}</span>
            {!isBot && (
              <span>{message.isRead ? "✓✓" : "✓"}</span>
            )}
          </div>
        </div>
      </div>

      {/* Product Carousel (after bot message) */}
      {isBot && message.products && message.products.length > 0 && (
        <div className="ml-9">
          <ProductCarousel
            products={message.products}
            onAddToCart={onAddToCart}
            onViewProduct={onViewProduct}
          />
        </div>
      )}

      {/* Quick Replies (after bot message) */}
      {isBot && message.quickReplies && message.quickReplies.length > 0 && (
        <div className="ml-9">
          <QuickReplies replies={message.quickReplies} onSelect={onQuickReply} />
        </div>
      )}
    </div>
  );
});

export default MessageBubble;
