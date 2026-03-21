"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { PricingRule, PricingJob, SourceSite } from "@/types";
import type {
  PriceAlertWithRelations,
  PriceSourceWithRelations,
  PricingDashboardData,
  PricingDecisionWithRelations,
  PricingHistoryRow,
} from "@/lib/pricing/queries";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_MUTED_TEXT,
  ADMIN_SELECT,
  ADMIN_TABLE_BODY_ROW,
  ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
} from "@/lib/admin-classes";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  PricingConfidenceBadge,
  PricingSeverityBadge,
  PricingSourceStatusBadge,
  PricingVerificationBadge,
} from "@/components/admin/pricing/PricingBadges";

type PricingTabKey = "overview" | "sources" | "rules" | "alerts" | "history" | "jobs" | "settings";

const tabs: { key: PricingTabKey; label: string }[] = [
  { key: "overview", label: "Genel Bakış" },
  { key: "sources", label: "Kaynaklar" },
  { key: "rules", label: "Kurallar" },
  { key: "alerts", label: "Alarmlar" },
  { key: "history", label: "Geçmiş" },
  { key: "jobs", label: "İşlemler" },
  { key: "settings", label: "Ayarlar" },
];

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error ?? "İstek başarısız");
  }
  return payload.data as T;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("tr-TR");
}

function MetricCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className={`${ADMIN_CARD} p-4`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-dark-500 dark:text-dark-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-dark-900 dark:text-dark-50">{value}</p>
      {helper ? <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">{helper}</p> : null}
    </div>
  );
}

export default function PricingAdminPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<PricingTabKey>("overview");
  const [dashboard, setDashboard] = useState<PricingDashboardData | null>(null);
  const [sources, setSources] = useState<PriceSourceWithRelations[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [alerts, setAlerts] = useState<PriceAlertWithRelations[]>([]);
  const [historyRows, setHistoryRows] = useState<PricingHistoryRow[]>([]);
  const [decisions, setDecisions] = useState<PricingDecisionWithRelations[]>([]);
  const [jobs, setJobs] = useState<PricingJob[]>([]);
  const [sites, setSites] = useState<SourceSite[]>([]);
  const [selectedSource, setSelectedSource] = useState<PriceSourceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingBatch, setStartingBatch] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceStatusFilter, setSourceStatusFilter] = useState("");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("");
  const [batchForm, setBatchForm] = useState({
    type: "batch_price_update",
    status: "",
    siteId: "",
    selectedOnly: true,
    manualReviewRequired: false,
  });
  const [ruleForm, setRuleForm] = useState({
    name: "",
    rule_type: "global",
    target_id: "",
    product_id: "",
    margin_percent: "",
    min_margin_amount: "",
    min_price: "",
    max_price: "",
    rounding_strategy: "round_99",
    priority: "100",
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardData, sourceData, ruleData, alertData, historyData, decisionData, jobData, siteData] =
        await Promise.all([
          fetchJson<PricingDashboardData>("/api/pricing/dashboard"),
          fetchJson<PriceSourceWithRelations[]>("/api/pricing/sources"),
          fetchJson<PricingRule[]>("/api/pricing/rules"),
          fetchJson<PriceAlertWithRelations[]>("/api/pricing/alerts?unresolvedOnly=false"),
          fetchJson<PricingHistoryRow[]>("/api/pricing/history?limit=25"),
          fetchJson<PricingDecisionWithRelations[]>("/api/pricing/decisions?limit=25"),
          fetchJson<PricingJob[]>("/api/pricing/jobs"),
          fetchJson<SourceSite[]>("/api/pricing/sites"),
        ]);

      setDashboard(dashboardData);
      setSources(sourceData);
      setRules(ruleData);
      setAlerts(alertData);
      setHistoryRows(historyData);
      setDecisions(decisionData);
      setJobs(jobData);
      setSites(siteData);
      setSelectedSource((prev) => sourceData.find((item) => item.id === prev?.id) ?? sourceData[0] ?? null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Fiyatlandırma verileri alınamadı", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!jobs.some((job) => job.status === "running" || job.status === "pending")) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadAll();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [jobs, loadAll]);

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      const q = sourceSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        source.product?.name?.toLowerCase().includes(q) ||
        source.product?.sku?.toLowerCase().includes(q) ||
        source.source_url.toLowerCase().includes(q);
      const matchesStatus = !sourceStatusFilter || source.status === sourceStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sourceSearch, sourceStatusFilter, sources]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => !alertSeverityFilter || alert.severity === alertSeverityFilter);
  }, [alertSeverityFilter, alerts]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => !jobStatusFilter || job.status === jobStatusFilter);
  }, [jobStatusFilter, jobs]);

  async function handleCheckSource(id: string) {
    try {
      await fetchJson(`/api/pricing/sources/${id}/check`, { method: "POST" });
      showToast("Kaynak yeniden kontrol edildi", "success");
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kaynak kontrolü başarısız", "error");
    }
  }

  async function handleVerify(id: string, approved: boolean) {
    try {
      await fetchJson(`/api/pricing/sources/${id}/verify`, {
        method: "POST",
        body: JSON.stringify({ approved }),
      });
      showToast(approved ? "Kaynak onaylandı" : "Kaynak reddedildi", "success");
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "İşlem başarısız", "error");
    }
  }

  async function handleSourceStatus(id: string, status: string) {
    try {
      await fetchJson(`/api/pricing/sources/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      showToast("Kaynak durumu güncellendi", "success");
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Durum güncellenemedi", "error");
    }
  }

  async function handleResolveAlert(id: string) {
    try {
      await fetchJson(`/api/pricing/alerts/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      showToast("Alarm çözüldü", "success");
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Alarm çözülemedi", "error");
    }
  }

  async function handleToggleRule(rule: PricingRule) {
    try {
      await fetchJson(`/api/pricing/rules/${rule.id}/status`, {
        method: "POST",
        body: JSON.stringify({ is_active: !rule.is_active }),
      });
      showToast("Kural durumu güncellendi", "success");
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kural güncellenemedi", "error");
    }
  }

  async function handleCreateRule() {
    try {
      await fetchJson("/api/pricing/rules", {
        method: "POST",
        body: JSON.stringify({
          ...ruleForm,
          target_id: ruleForm.target_id || null,
          product_id: ruleForm.product_id || null,
          margin_percent: ruleForm.margin_percent ? Number(ruleForm.margin_percent) : null,
          min_margin_amount: ruleForm.min_margin_amount ? Number(ruleForm.min_margin_amount) : null,
          min_price: ruleForm.min_price ? Number(ruleForm.min_price) : null,
          max_price: ruleForm.max_price ? Number(ruleForm.max_price) : null,
          priority: Number(ruleForm.priority),
        }),
      });
      showToast("Yeni kural oluşturuldu", "success");
      setRuleForm({
        name: "",
        rule_type: "global",
        target_id: "",
        product_id: "",
        margin_percent: "",
        min_margin_amount: "",
        min_price: "",
        max_price: "",
        rounding_strategy: "round_99",
        priority: "100",
      });
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kural oluşturulamadı", "error");
    }
  }

  async function handleUpdateSite(siteId: string, isActive: boolean) {
    try {
      await fetchJson(`/api/pricing/sites/${siteId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      });
      showToast("Kaynak site güncellendi", "success");
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kaynak site güncellenemedi", "error");
    }
  }

  async function handleStartBatchJob() {
    try {
      setStartingBatch(true);
      await fetchJson("/api/pricing/batch-update", {
        method: "POST",
        body: JSON.stringify({
          type: batchForm.type,
          filters: {
            status: batchForm.status || undefined,
            siteId: batchForm.siteId || undefined,
            selectedOnly: batchForm.selectedOnly,
            manualReviewRequired: batchForm.manualReviewRequired || undefined,
          },
        }),
      });
      showToast("Batch job baslatildi", "success");
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Batch job baslatilamadi", "error");
    } finally {
      setStartingBatch(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Fiyatlandırma</h1>
          <p className={ADMIN_MUTED_TEXT}>Kaynaklar, kurallar, alarmlar ve karar geçmişi tek ekrandan yönetilir.</p>
        </div>
        <button onClick={() => void loadAll()} className={ADMIN_BTN_SECONDARY}>
          <RefreshCw size={16} />
          Yenile
        </button>
      </div>

      <div className={`${ADMIN_CARD} overflow-x-auto`}>
        <div className="flex min-w-max gap-2 p-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary-600 text-white"
                  : "bg-dark-50 text-dark-600 hover:bg-dark-100 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className={`${ADMIN_CARD} p-8 text-center text-sm text-dark-500 dark:text-dark-400`}>Yükleniyor...</div> : null}

      {!loading && activeTab === "overview" && dashboard && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <MetricCard title="Aktif Kaynak" value={String(dashboard.activeSourceCount)} />
            <MetricCard title="Ortalama Confidence" value={dashboard.averageConfidence.toFixed(1)} />
            <MetricCard title="Manual Review" value={String(dashboard.manualReviewCount)} />
            <MetricCard
              title="Aktif Alarm"
              value={String(dashboard.activeAlertCount)}
              helper={`Son güncelleme: ${formatDate(dashboard.lastUpdateAt)}`}
            />
            <MetricCard title="Çalışan Job" value={String(dashboard.runningJobCount)} />
            <MetricCard
              title="Son Batch"
              value={dashboard.lastBatchResult?.status ?? "—"}
              helper={
                dashboard.lastFailedJob
                  ? `Son hata: ${formatDate(dashboard.lastFailedJob.finished_at ?? dashboard.lastFailedJob.created_at)}`
                  : undefined
              }
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <div className={`${ADMIN_CARD} overflow-hidden`}>
              <div className="border-b border-dark-100 px-4 py-3 dark:border-dark-700">
                <h2 className="font-semibold text-dark-900 dark:text-dark-50">Site Sağlık Özeti</h2>
              </div>
              <table className="w-full text-left text-sm">
                <thead className={ADMIN_TABLE_HEADER_ROW}>
                  <tr>
                    <th className={ADMIN_TABLE_TH}>Site</th>
                    <th className={ADMIN_TABLE_TH}>Health</th>
                    <th className={ADMIN_TABLE_TH}>Başarılı / 30g</th>
                    <th className={ADMIN_TABLE_TH}>Son Başarı</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.siteHealth.map((site) => (
                    <tr key={site.id} className={ADMIN_TABLE_BODY_ROW}>
                      <td className={ADMIN_TABLE_TD}>{site.name}</td>
                      <td className={ADMIN_TABLE_TD}>
                        <PricingConfidenceBadge score={site.health_score} />
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        {site.successful_scrapes_30d} / {site.total_scrapes_30d}
                      </td>
                      <td className={ADMIN_TABLE_TD}>{formatDate(site.last_success_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`${ADMIN_CARD} p-4`}>
              <h2 className="font-semibold text-dark-900 dark:text-dark-50">Son İşler</h2>
              <div className="mt-4 space-y-3">
                {dashboard.recentJobs.map((job) => (
                  <div key={job.id} className="rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-dark-900 dark:text-dark-50">{job.type}</p>
                      <PricingSourceStatusBadge
                        status={
                          job.status === "completed"
                            ? "active"
                            : job.status === "running"
                              ? "fallback_candidate"
                              : "manual_review"
                        }
                      />
                    </div>
                    <p className="mt-1 text-xs text-dark-500 dark:text-dark-400">
                      {job.processed_items}/{job.total_items} işlendi • {formatDate(job.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "sources" && (
        <div className="space-y-4">
          <div className={`${ADMIN_CARD} p-4`}>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  className={`${ADMIN_INPUT} pl-9`}
                  placeholder="Ürün, SKU veya URL ara"
                />
              </div>
              <select value={sourceStatusFilter} onChange={(e) => setSourceStatusFilter(e.target.value)} className={ADMIN_SELECT}>
                <option value="">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="manual_review">Manual Review</option>
                <option value="invalid_match">Invalid Match</option>
                <option value="disabled">Pasif</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <div className={`${ADMIN_CARD} overflow-hidden`}>
              <table className="w-full text-left text-sm">
                <thead className={ADMIN_TABLE_HEADER_ROW}>
                  <tr>
                    <th className={ADMIN_TABLE_TH}>Ürün</th>
                    <th className={ADMIN_TABLE_TH}>Site</th>
                    <th className={ADMIN_TABLE_TH}>Durum</th>
                    <th className={ADMIN_TABLE_TH}>Confidence</th>
                    <th className={ADMIN_TABLE_TH}>Son Fiyat</th>
                    <th className={ADMIN_TABLE_TH}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSources.map((source) => (
                    <tr key={source.id} className={ADMIN_TABLE_BODY_ROW}>
                      <td className={ADMIN_TABLE_TD}>
                        <button className="text-left hover:text-primary-600" onClick={() => setSelectedSource(source)}>
                          <div className="font-medium">{source.product?.name ?? "Ürün"}</div>
                          <div className="text-xs text-dark-500 dark:text-dark-400">{source.product?.sku ?? "—"}</div>
                        </button>
                      </td>
                      <td className={ADMIN_TABLE_TD}>{source.source_site?.name ?? "—"}</td>
                      <td className={ADMIN_TABLE_TD}>
                        <PricingSourceStatusBadge status={source.status} />
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <PricingConfidenceBadge score={source.confidence_score} />
                      </td>
                      <td className={ADMIN_TABLE_TD}>{source.last_price != null ? formatPrice(source.last_price) : "—"}</td>
                      <td className={ADMIN_TABLE_TD}>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => void handleCheckSource(source.id)} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                            Şimdi kontrol et
                          </button>
                          <button onClick={() => void handleVerify(source.id, true)} className="text-xs font-medium text-green-600 hover:text-green-700">
                            Verify
                          </button>
                          <button onClick={() => void handleVerify(source.id, false)} className="text-xs font-medium text-red-600 hover:text-red-700">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`${ADMIN_CARD} p-4`}>
              <h2 className="font-semibold text-dark-900 dark:text-dark-50">Kaynak Detayı</h2>
              {selectedSource ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-dark-900 dark:text-dark-50">{selectedSource.product?.name}</p>
                    <p className="text-dark-500 dark:text-dark-400">{selectedSource.product?.sku}</p>
                  </div>
                  <div className="rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-dark-500 dark:text-dark-400">Durum</span>
                      <PricingSourceStatusBadge status={selectedSource.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-dark-500 dark:text-dark-400">Verification</span>
                      <PricingVerificationBadge
                        method={selectedSource.verification_method}
                        matchVerified={selectedSource.match_verified}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-dark-500 dark:text-dark-400">Match Score</span>
                      <span>{selectedSource.match_score ?? "—"}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-dark-500 dark:text-dark-400">Son kontrol</span>
                      <span>{formatDate(selectedSource.last_checked_at)}</span>
                    </div>
                  </div>
                  <a
                    href={selectedSource.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink size={14} />
                    Kaynak URL&apos;yi aç
                  </a>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void handleCheckSource(selectedSource.id)} className={ADMIN_BTN_PRIMARY}>
                      Şimdi kontrol et
                    </button>
                    <button onClick={() => void handleSourceStatus(selectedSource.id, "disabled")} className={ADMIN_BTN_SECONDARY}>
                      Disable
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-dark-500 dark:text-dark-400">Detay görmek için bir kaynak seçin.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "rules" && (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={`${ADMIN_CARD} overflow-hidden`}>
            <table className="w-full text-left text-sm">
              <thead className={ADMIN_TABLE_HEADER_ROW}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>Kural</th>
                  <th className={ADMIN_TABLE_TH}>Tür</th>
                  <th className={ADMIN_TABLE_TH}>Marj</th>
                  <th className={ADMIN_TABLE_TH}>Öncelik</th>
                  <th className={ADMIN_TABLE_TH}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className={ADMIN_TABLE_BODY_ROW}>
                    <td className={ADMIN_TABLE_TD}>{rule.name}</td>
                    <td className={ADMIN_TABLE_TD}>{rule.rule_type}</td>
                    <td className={ADMIN_TABLE_TD}>{rule.margin_percent ?? 0}%</td>
                    <td className={ADMIN_TABLE_TD}>{rule.priority}</td>
                    <td className={ADMIN_TABLE_TD}>
                      <button onClick={() => void handleToggleRule(rule)} className="inline-flex items-center gap-2 text-sm font-medium text-dark-700 dark:text-dark-200">
                        {rule.is_active ? <ToggleRight className="text-green-600" size={18} /> : <ToggleLeft className="text-dark-400" size={18} />}
                        {rule.is_active ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${ADMIN_CARD} p-4`}>
            <h2 className="font-semibold text-dark-900 dark:text-dark-50">Yeni Kural</h2>
            <div className="mt-4 grid gap-3">
              <input className={ADMIN_INPUT} placeholder="Kural adı" value={ruleForm.name} onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))} />
              <select className={ADMIN_SELECT} value={ruleForm.rule_type} onChange={(e) => setRuleForm((prev) => ({ ...prev, rule_type: e.target.value }))}>
                <option value="global">Global</option>
                <option value="brand">Marka</option>
                <option value="category">Kategori</option>
                <option value="product">Ürün</option>
              </select>
              <input className={ADMIN_INPUT} placeholder="Target ID (opsiyonel)" value={ruleForm.target_id} onChange={(e) => setRuleForm((prev) => ({ ...prev, target_id: e.target.value }))} />
              <input className={ADMIN_INPUT} placeholder="Margin %" value={ruleForm.margin_percent} onChange={(e) => setRuleForm((prev) => ({ ...prev, margin_percent: e.target.value }))} />
              <input className={ADMIN_INPUT} placeholder="Min marj tutarı" value={ruleForm.min_margin_amount} onChange={(e) => setRuleForm((prev) => ({ ...prev, min_margin_amount: e.target.value }))} />
              <input className={ADMIN_INPUT} placeholder="Min fiyat" value={ruleForm.min_price} onChange={(e) => setRuleForm((prev) => ({ ...prev, min_price: e.target.value }))} />
              <input className={ADMIN_INPUT} placeholder="Max fiyat" value={ruleForm.max_price} onChange={(e) => setRuleForm((prev) => ({ ...prev, max_price: e.target.value }))} />
              <select className={ADMIN_SELECT} value={ruleForm.rounding_strategy} onChange={(e) => setRuleForm((prev) => ({ ...prev, rounding_strategy: e.target.value }))}>
                <option value="none">Yuvarlama yok</option>
                <option value="round_99">.99 bitir</option>
                <option value="round_nearest_10">En yakın 10</option>
              </select>
              <input className={ADMIN_INPUT} placeholder="Öncelik" value={ruleForm.priority} onChange={(e) => setRuleForm((prev) => ({ ...prev, priority: e.target.value }))} />
              <button onClick={() => void handleCreateRule()} className={ADMIN_BTN_PRIMARY}>Kural oluştur</button>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "alerts" && (
        <div className="space-y-4">
          <div className={`${ADMIN_CARD} p-4`}>
            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <select value={alertSeverityFilter} onChange={(e) => setAlertSeverityFilter(e.target.value)} className={ADMIN_SELECT}>
                <option value="">Tüm severity</option>
                <option value="critical">critical</option>
                <option value="warning">warning</option>
                <option value="info">info</option>
              </select>
              <p className="text-sm text-dark-500 dark:text-dark-400">Resolve edilen kayıtlar da listede kalır. Faz 2’de alarm geçmişi salt okunur tutulur.</p>
            </div>
          </div>

          <div className={`${ADMIN_CARD} overflow-hidden`}>
            <table className="w-full text-left text-sm">
              <thead className={ADMIN_TABLE_HEADER_ROW}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>Severity</th>
                  <th className={ADMIN_TABLE_TH}>Ürün</th>
                  <th className={ADMIN_TABLE_TH}>Mesaj</th>
                  <th className={ADMIN_TABLE_TH}>Tarih</th>
                  <th className={ADMIN_TABLE_TH}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className={ADMIN_TABLE_BODY_ROW}>
                    <td className={ADMIN_TABLE_TD}><PricingSeverityBadge severity={alert.severity} /></td>
                    <td className={ADMIN_TABLE_TD}>{alert.product?.name ?? "—"}</td>
                    <td className={ADMIN_TABLE_TD}>{alert.message}</td>
                    <td className={ADMIN_TABLE_TD}>{formatDate(alert.created_at)}</td>
                    <td className={ADMIN_TABLE_TD}>
                      {alert.is_resolved ? (
                        <span className="text-xs text-green-600">Çözüldü</span>
                      ) : (
                        <button onClick={() => void handleResolveAlert(alert.id)} className="text-xs font-medium text-primary-600 hover:text-primary-700">Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === "history" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className={`${ADMIN_CARD} overflow-hidden`}>
            <div className="border-b border-dark-100 px-4 py-3 dark:border-dark-700">
              <h2 className="font-semibold text-dark-900 dark:text-dark-50">Fiyat Geçmişi</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className={ADMIN_TABLE_HEADER_ROW}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>Ürün</th>
                  <th className={ADMIN_TABLE_TH}>Tür</th>
                  <th className={ADMIN_TABLE_TH}>Eski</th>
                  <th className={ADMIN_TABLE_TH}>Yeni</th>
                  <th className={ADMIN_TABLE_TH}>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={row.id} className={ADMIN_TABLE_BODY_ROW}>
                    <td className={ADMIN_TABLE_TD}>{row.product?.name ?? "—"}</td>
                    <td className={ADMIN_TABLE_TD}>{row.price_type}</td>
                    <td className={ADMIN_TABLE_TD}>{row.old_price != null ? formatPrice(row.old_price) : "—"}</td>
                    <td className={ADMIN_TABLE_TD}>{formatPrice(row.new_price)}</td>
                    <td className={ADMIN_TABLE_TD}>{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${ADMIN_CARD} overflow-hidden`}>
            <div className="border-b border-dark-100 px-4 py-3 dark:border-dark-700">
              <h2 className="font-semibold text-dark-900 dark:text-dark-50">Karar Geçmişi</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className={ADMIN_TABLE_HEADER_ROW}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>Ürün</th>
                  <th className={ADMIN_TABLE_TH}>Karar</th>
                  <th className={ADMIN_TABLE_TH}>Final Fiyat</th>
                  <th className={ADMIN_TABLE_TH}>Confidence</th>
                  <th className={ADMIN_TABLE_TH}>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((decision) => (
                  <tr key={decision.id} className={ADMIN_TABLE_BODY_ROW}>
                    <td className={ADMIN_TABLE_TD}>{decision.product?.name ?? "—"}</td>
                    <td className={ADMIN_TABLE_TD}>
                      <div className="font-medium">{decision.decision_type}</div>
                      <div className="text-xs text-dark-500 dark:text-dark-400">
                        {decision.price_actually_updated ? "Fiyat yazıldı" : "Fiyat yazılmadı"}
                      </div>
                    </td>
                    <td className={ADMIN_TABLE_TD}>{decision.final_price != null ? formatPrice(decision.final_price) : "—"}</td>
                    <td className={ADMIN_TABLE_TD}><PricingConfidenceBadge score={decision.confidence_at_decision ?? 0} /></td>
                    <td className={ADMIN_TABLE_TD}>{formatDate(decision.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === "jobs" && (
        <div className="space-y-4">
          <div className={`${ADMIN_CARD} p-4`}>
            <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px_auto]">
              <select className={ADMIN_SELECT} value={batchForm.type} onChange={(e) => setBatchForm((prev) => ({ ...prev, type: e.target.value }))}>
                <option value="batch_price_update">Batch Price Update</option>
                <option value="batch_scrape">Batch Scrape</option>
              </select>
              <select className={ADMIN_SELECT} value={batchForm.status} onChange={(e) => setBatchForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="">Tüm Statusler</option>
                <option value="active">active</option>
                <option value="manual_review">manual_review</option>
                <option value="fallback_candidate">fallback_candidate</option>
                <option value="invalid_match">invalid_match</option>
                <option value="not_found">not_found</option>
              </select>
              <select className={ADMIN_SELECT} value={batchForm.siteId} onChange={(e) => setBatchForm((prev) => ({ ...prev, siteId: e.target.value }))}>
                <option value="">Tüm Siteler</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              <button onClick={() => void handleStartBatchJob()} className={ADMIN_BTN_PRIMARY} disabled={startingBatch}>
                {startingBatch ? <LoaderCircle size={16} className="animate-spin" /> : null}
                Tümünü Güncelle
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-dark-600 dark:text-dark-300">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={batchForm.selectedOnly} onChange={(e) => setBatchForm((prev) => ({ ...prev, selectedOnly: e.target.checked }))} className="h-4 w-4 rounded accent-primary-600" />
                Yalnız seçili aktif kaynaklar
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={batchForm.manualReviewRequired} onChange={(e) => setBatchForm((prev) => ({ ...prev, manualReviewRequired: e.target.checked }))} className="h-4 w-4 rounded accent-primary-600" />
                Manual review gerektirenleri dahil et
              </label>
            </div>
          </div>

          <div className={`${ADMIN_CARD} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-dark-900 dark:text-dark-50">Pricing Job Listesi</h2>
              <select className={ADMIN_SELECT} value={jobStatusFilter} onChange={(e) => setJobStatusFilter(e.target.value)}>
                <option value="">Tüm Job Durumları</option>
                <option value="pending">pending</option>
                <option value="running">running</option>
                <option value="completed">completed</option>
                <option value="failed">failed</option>
              </select>
            </div>
          </div>

          <div className={`${ADMIN_CARD} overflow-hidden`}>
            <table className="w-full text-left text-sm">
              <thead className={ADMIN_TABLE_HEADER_ROW}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>Tip</th>
                  <th className={ADMIN_TABLE_TH}>Status</th>
                  <th className={ADMIN_TABLE_TH}>Başlangıç</th>
                  <th className={ADMIN_TABLE_TH}>Bitiş</th>
                  <th className={ADMIN_TABLE_TH}>İlerleme</th>
                  <th className={ADMIN_TABLE_TH}>Tetikleyen</th>
                  <th className={ADMIN_TABLE_TH}>Filtre</th>
                  <th className={ADMIN_TABLE_TH}>Hata Özeti</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id} className={ADMIN_TABLE_BODY_ROW}>
                    <td className={ADMIN_TABLE_TD}>{job.type}</td>
                    <td className={ADMIN_TABLE_TD}>{job.status}</td>
                    <td className={ADMIN_TABLE_TD}>{formatDate(job.started_at || job.created_at)}</td>
                    <td className={ADMIN_TABLE_TD}>{formatDate(job.finished_at)}</td>
                    <td className={ADMIN_TABLE_TD}>
                      {job.processed_items}/{job.total_items} • {job.success_count}/{job.failure_count}/{job.skipped_count}
                    </td>
                    <td className={ADMIN_TABLE_TD}>{job.triggered_by ?? "—"}</td>
                    <td className={ADMIN_TABLE_TD}>
                      <span className="line-clamp-2 text-xs text-dark-500 dark:text-dark-400">
                        {Object.keys(job.filters ?? {}).length ? JSON.stringify(job.filters) : "Varsayılan"}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <span className="line-clamp-2 text-xs text-dark-500 dark:text-dark-400">
                        {typeof job.metadata?.error_summary === "string" && job.metadata.error_summary
                          ? job.metadata.error_summary
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === "settings" && (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={`${ADMIN_CARD} overflow-hidden`}>
            <table className="w-full text-left text-sm">
              <thead className={ADMIN_TABLE_HEADER_ROW}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>Site</th>
                  <th className={ADMIN_TABLE_TH}>Priority</th>
                  <th className={ADMIN_TABLE_TH}>Rate Limit</th>
                  <th className={ADMIN_TABLE_TH}>Durum</th>
                  <th className={ADMIN_TABLE_TH}>Health</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.id} className={ADMIN_TABLE_BODY_ROW}>
                    <td className={ADMIN_TABLE_TD}>
                      <div className="font-medium">{site.name}</div>
                      <div className="text-xs text-dark-500 dark:text-dark-400">{site.base_url}</div>
                    </td>
                    <td className={ADMIN_TABLE_TD}>{site.priority}</td>
                    <td className={ADMIN_TABLE_TD}>{site.rate_limit_ms} ms</td>
                    <td className={ADMIN_TABLE_TD}>
                      <button onClick={() => void handleUpdateSite(site.id, !site.is_active)} className="inline-flex items-center gap-2 text-sm font-medium text-dark-700 dark:text-dark-200">
                        {site.is_active ? <ToggleRight className="text-green-600" size={18} /> : <ToggleLeft className="text-dark-400" size={18} />}
                        {site.is_active ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td className={ADMIN_TABLE_TD}><PricingConfidenceBadge score={site.health_score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${ADMIN_CARD} p-4`}>
            <h2 className="font-semibold text-dark-900 dark:text-dark-50">Ayar Notları</h2>
            <div className="mt-4 space-y-3 text-sm text-dark-600 dark:text-dark-300">
              <div className="flex items-start gap-3 rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                <Settings2 size={18} className="mt-0.5 text-primary-600" />
                <div>
                  <p className="font-medium text-dark-900 dark:text-dark-50">Kaynak site yönetimi aktif</p>
                  <p>Rate limit, selectors ve header verileri Faz 2’de okunur ve PATCH ile güncellenir.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                <ShieldCheck size={18} className="mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium text-dark-900 dark:text-dark-50">Gerçek fallback aktif</p>
                  <p>Confidence veya status düşen aktif kaynak otomatik fallback ile değişebilir; karar ve yeni aktif kaynak panelde görünür.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                <AlertTriangle size={18} className="mt-0.5 text-yellow-600" />
                <div>
                  <p className="font-medium text-dark-900 dark:text-dark-50">Kur placeholderı</p>
                  <p>Manuel kur yönetimi Faz 2’de read model seviyesinde bırakıldı; otomatik kur ve batch tetikleme Faz 3 kapsamındadır.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                <CheckCircle2 size={18} className="mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium text-dark-900 dark:text-dark-50">Admin audit korunur</p>
                  <p>Source verify/reject, rule create, alert resolve ve settings güncellemeleri server-side action üzerinden audit log’a yazılır.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
