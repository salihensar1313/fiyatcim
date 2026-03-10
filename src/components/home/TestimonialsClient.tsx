"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import Rating from "@/components/ui/Rating";
import type { Testimonial } from "@/types";

interface Props {
  items: Testimonial[];
}

export default function TestimonialsClient({ items }: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current >= items.length) setCurrent(0);
  }, [items.length, current]);

  const prev = () => setCurrent((c) => (c - 1 + items.length) % items.length);
  const next = () => setCurrent((c) => (c + 1) % items.length);

  if (items.length === 0) return null;

  return (
    <section className="bg-dark-900 py-12 sm:py-16">
      <div className="container-custom">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Müşteri Yorumları</h2>
          <p className="mt-2 text-dark-400">Binlerce mutlu müşterimizden bazıları</p>
        </div>

        <div className="relative mx-auto mt-8 max-w-2xl">
          <div className="rounded-xl bg-dark-800 p-6 sm:p-8">
            <Quote size={32} className="text-primary-600" />
            <p className="mt-4 text-base leading-relaxed text-dark-300 sm:text-lg">
              {items[current].comment}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">
                {items[current].name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white">{items[current].name}</p>
                <p className="text-sm text-dark-400">{items[current].company}</p>
              </div>
              <div className="ml-auto">
                <Rating rating={items[current].rating} size="sm" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="rounded-full bg-dark-800 p-2 text-dark-400 transition-colors hover:bg-dark-700 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? "w-6 bg-primary-600" : "w-2 bg-dark-600"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="rounded-full bg-dark-800 p-2 text-dark-400 transition-colors hover:bg-dark-700 hover:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
