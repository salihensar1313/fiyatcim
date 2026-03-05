"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 lg:bottom-6 left-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all hover:bg-primary-700 hover:scale-110"
      aria-label="Yukarı çık"
    >
      <ArrowUp size={20} />
    </button>
  );
}
