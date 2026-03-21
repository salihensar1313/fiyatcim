"use client";

import Badge from "@/components/ui/Badge";

const SOURCE_STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  fallback_candidate: "Fallback Adayı",
  blocked: "Engelli",
  not_found: "Bulunamadı",
  invalid_match: "Eşleşme Hatalı",
  manual_review: "Manuel İnceleme",
  disabled: "Pasif",
};

const SOURCE_STATUS_VARIANTS: Record<string, "green" | "yellow" | "red" | "gray" | "blue"> = {
  active: "green",
  fallback_candidate: "blue",
  blocked: "red",
  not_found: "red",
  invalid_match: "red",
  manual_review: "yellow",
  disabled: "gray",
};

const SEVERITY_VARIANTS: Record<string, "blue" | "yellow" | "red"> = {
  info: "blue",
  warning: "yellow",
  critical: "red",
};

const SEVERITY_LABELS: Record<string, string> = {
  info: "Bilgi",
  warning: "Uyarı",
  critical: "Kritik",
};

export function PricingSourceStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={SOURCE_STATUS_VARIANTS[status] ?? "gray"}>
      {SOURCE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function PricingSeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant={SEVERITY_VARIANTS[severity] ?? "blue"}>
      {SEVERITY_LABELS[severity] ?? severity}
    </Badge>
  );
}

export function PricingVerificationBadge({ method, matchVerified }: { method: string | null; matchVerified: boolean }) {
  if (matchVerified && method === "auto") {
    return <Badge variant="green">Otomatik</Badge>;
  }
  if (matchVerified && method === "manual") {
    return <Badge variant="blue">Manuel</Badge>;
  }
  return <Badge variant="gray">Doğrulanmadı</Badge>;
}

export function PricingConfidenceBadge({ score }: { score: number | null | undefined }) {
  const value = Number(score ?? 0);
  if (value >= 80) return <Badge variant="green">{value}</Badge>;
  if (value >= 60) return <Badge variant="yellow">{value}</Badge>;
  return <Badge variant="red">{value}</Badge>;
}

export function formatSourceStatus(status: string) {
  return SOURCE_STATUS_LABELS[status] ?? status;
}
