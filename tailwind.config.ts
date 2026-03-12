import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        dark: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
          950: "#030712",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
        },
      },
      keyframes: {
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.8) translateY(10px)" },
          "60%": { opacity: "1", transform: "scale(1.05) translateY(-2px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(5px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "cimbot-wave": {
          "0%, 50%, 100%": { transform: "translateY(0)" },
          "55%": { transform: "translateY(-4px)" },
          "60%": { transform: "translateY(0)" },
          "65%": { transform: "translateY(-3px)" },
          "70%": { transform: "translateY(0)" },
          "75%": { transform: "translateY(-2px)" },
          "80%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "bounce-in": "bounce-in 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "cimbot-wave": "cimbot-wave 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
