"use client";

import { useState, useEffect } from "react";

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
  /** false until first client tick — use to avoid hydration mismatch */
  ready: boolean;
}

const EXPIRED: CountdownResult = {
  hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0, ready: true,
};

/** Countdown hook for flash sale timer */
export function useCountdown(endDate: string | undefined): CountdownResult {
  const [result, setResult] = useState<CountdownResult>({
    hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0, ready: false,
  });

  useEffect(() => {
    if (!endDate) {
      setResult(EXPIRED);
      return;
    }

    function calc() {
      const diff = new Date(endDate!).getTime() - Date.now();
      if (diff <= 0) return EXPIRED;
      const totalSeconds = Math.floor(diff / 1000);
      return {
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        isExpired: false,
        totalSeconds,
        ready: true,
      };
    }

    setResult(calc());
    const timer = setInterval(() => setResult(calc()), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return result;
}

/** Format countdown as "HH:MM:SS" */
export function formatCountdown(cd: CountdownResult): string {
  if (cd.isExpired) return "00:00:00";
  const h = String(cd.hours).padStart(2, "0");
  const m = String(cd.minutes).padStart(2, "0");
  const s = String(cd.seconds).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
