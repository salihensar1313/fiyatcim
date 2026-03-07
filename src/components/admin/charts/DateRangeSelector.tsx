"use client";

import type { DateRange } from "@/types/admin";

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const OPTIONS: { key: DateRange; label: string }[] = [
  { key: "today", label: "Bugün" },
  { key: "7d", label: "7 Gün" },
  { key: "30d", label: "30 Gün" },
  { key: "all", label: "Tümü" },
];

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-dark-100 p-1 dark:bg-dark-700">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.key
              ? "bg-white text-dark-900 shadow-sm dark:bg-dark-600 dark:text-dark-50"
              : "text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
