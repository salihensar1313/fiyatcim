"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-dark-100 rounded-xl border border-dark-100">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-dark-900 dark:text-dark-50 hover:bg-dark-50"
          >
            <span>{item.title}</span>
            <ChevronDown
              size={18}
              className={cn(
                "shrink-0 text-dark-400 transition-transform duration-200",
                openIndex === i && "rotate-180"
              )}
            />
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <p className="px-5 pb-4 text-sm leading-relaxed text-dark-600 dark:text-dark-300">{item.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
