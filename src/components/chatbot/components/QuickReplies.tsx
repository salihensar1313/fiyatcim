"use client";

import React from "react";
import type { QuickReply } from "../types";

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (value: string) => void;
}

const QuickReplies = React.memo(function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {replies.map((reply, i) => (
        <button
          key={`${reply.value}-${i}`}
          onClick={() => onSelect(reply.value)}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3.5 py-1.5 text-xs font-medium text-primary-700 shadow-sm transition-all hover:bg-primary-50 hover:border-primary-300 hover:shadow active:scale-95 dark:border-primary-700 dark:bg-dark-700 dark:text-primary-300 dark:hover:bg-dark-600"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {reply.icon && <span className="text-sm">{reply.icon}</span>}
          {reply.label}
        </button>
      ))}
    </div>
  );
});

export default QuickReplies;
