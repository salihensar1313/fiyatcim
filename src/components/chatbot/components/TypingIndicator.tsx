"use client";

import React from "react";
import Image from "next/image";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-2">
      {/* Bot avatar */}
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-600">
        <Image src="/images/cimbot-transparent.png" alt="CimBot" width={28} height={28} className="h-full w-full object-cover" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm dark:bg-dark-700">
        <div className="flex items-center gap-1">
          <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
          <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
          <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
      <style jsx>{`
        .typing-dot {
          animation: typingBounce 1.2s infinite ease-in-out;
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
