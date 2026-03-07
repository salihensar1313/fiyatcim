"use client";

import { useReportWebVitals } from "next/web-vitals";

export default function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics (console in dev, can be extended to GA4 or custom endpoint)
    if (process.env.NODE_ENV === "development") {
      console.log(`[WebVital] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`);
    }

    // Send to Google Analytics if available
    if (typeof window !== "undefined" && "gtag" in window) {
      const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
      gtag("event", metric.name, {
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }
  });

  return null;
}
