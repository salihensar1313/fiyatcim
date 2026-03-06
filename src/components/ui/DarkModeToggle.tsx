"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function DarkModeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  const cycle = () => {
    const order = ["light", "dark", "system"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % 3]);
  };

  // Server ve ilk render'da sabit ikon göster — hydration mismatch önlenir
  const icon = !mounted ? (
    <Monitor size={20} />
  ) : theme === "dark" ? (
    <Moon size={20} />
  ) : theme === "light" ? (
    <Sun size={20} />
  ) : (
    <Monitor size={20} />
  );

  return (
    <button
      onClick={cycle}
      className="rounded-lg p-2 text-dark-300 transition-colors hover:text-white"
      aria-label={`Tema: ${theme === "light" ? "Açık" : theme === "dark" ? "Koyu" : "Sistem"}`}
      title={theme === "light" ? "Açık Tema" : theme === "dark" ? "Koyu Tema" : "Sistem Teması"}
    >
      {icon}
    </button>
  );
}
