"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import type { PricingRule, Product, SourceSite } from "@/types";
import type {
  PriceAlertWithRelations,
  PriceSourceWithRelations,
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
} from "@/lib/admin-classes";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  PricingConfidenceBadge,
  PricingSeverityBadge,
  PricingSourceStatusBadge,
  PricingVerificationBadge,
} from "@/components/admin/pricing/PricingBadges";

type PricingPanelTab = "sources" | "pricing" | "history";

interface ProductPricingPanelProps {
  product: Product | null | undefined;
  activeTab: PricingPanelTab;
}

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

export default function ProductPricingPanel({ product, activeTab }: ProductPricingPanelProps) {
  const { showToast } = useToast();
  const [sources, setSources] = useState<PriceSourceWithRelations[]>([]);
  const [historyRows, setHistoryRows] = useState<PricingHistoryRow[]>([]);
  const [decisions, setDecisions] = useState<PricingDecisionWithRelations[]>([]);
  const [alerts, setAlerts] = useState<PriceAlertWithRelations[]>([]);
  const [sites, setSites] = useState<SourceSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceForm, setSourceForm] = useState({
    source_site_id: "",
    source_url: "",
    source_sku: "",
    source_brand: "",
    source_title: "",
  });
  const [manualPrice, setManualPrice] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [priceLocked, setPriceLocked] = useState(false);
  const [priceLockTouched, setPriceLockTouched] = useState(false);
  const [ruleOverride, setRuleOverride] = useState({
    id: "",
    name: "",
    margin_percent: "",
    min_margin_amount: "",
    min_price: "",
    max_price: "",
    rounding_strategy: "round_99",
    priority: "999",
  });

  const loadData = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    try {
      const [sourceData, historyData, decisionData, alertData, ruleData, siteData] = await Promise.all([
        fetchJson<PriceSourceWithRelations[]>(`/api/pricing/sources?productId=${product.id}`),
        fetchJson<PricingHistoryRow[]>(`/api/pricing/history?productId=${product.id}&limit=20`),
        fetchJson<PricingDecisionWithRelations[]>(`/api/pricing/decisions?productId=${product.id}&limit=20`),
        fetchJson<PriceAlertWithRelations[]>(`/api/pricing/alerts?productId=${product.id}&unresolvedOnly=false`),
        fetchJson<PricingRule[]>(`/api/pricing/rules?productId=${product.id}`),
        fetchJson<SourceSite[]>("/api/pricing/sites"),
      ]);

      setSources(sourceData);
      setHistoryRows(historyData);
      setDecisions(decisionData);
      setAlerts(alertData);
      setSites(siteData);
      setPriceLocked(Boolean(product.price_locked));
      setPriceLockTouched(false);

      const productRule = ruleData.find((rule) => rule.rule_type === "product" && rule.product_id === product.id);
      setRuleOverride({
        id: productRule?.id ?? "",
        name: productRule?.name ?? `${product.name} Override`,
        margin_percent: productRule?.margin_percent != null ? String(productRule.margin_percent) : "",
        min_margin_amount: productRule?.min_margin_amount != null ? String(productRule.min_margin_amount) : "",
        min_price: productRule?.min_price != null ? String(productRule.min_price) : "",
        max_price: productRule?.max_price != null ? String(productRule.max_price) : "",
        rounding_strategy: productRule?.rounding_strategy ?? "round_99",
        priority: productRule?.priority != null ? String(productRule.priority) : "999",
      });

      setSourceForm((prev) => {
        if (prev.source_site_id || !siteData[0]?.id) return prev;
        return { ...prev, source_site_id: siteData[0].id };
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Pricing verileri alınamadı", "error");
    } finally {
      setLoading(false);
    }
  }, [product?.id, product?.name, product?.price_locked, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedSource = useMemo(() => {
    return sources.find((source) => source.id === product?.price_source_id) ?? sources[0] ?? null;
  }, [product?.price_source_id, sources]);

  const alternativeSources = useMemo(() => {
    return sources.filter((source) => source.id !== selectedSource?.id);
  }, [selectedSource?.id, sources]);

  async function handleSourceAction(url: string, init: RequestInit, successMessage: string) {
    try {
      await fetchJson(url, init);
      showToast(successMessage, "success");
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "İşlem başarısız", "error");
    }
  }

  async function handleCreateSource() {
    if (!product?.id) return;
    if (!sourceForm.source_site_id || !sourceForm.source_url) {
      showToast("Site ve URL zorunlu", "error");
      return;
    }
    await handleSourceAction(
      "/api/pricing/sources",
      {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          source_site_id: sourceForm.source_site_id,
          source_url: sourceForm.source_url,
          source_sku: sourceForm.source_sku || null,
          source_brand: sourceForm.source_brand || null,
          source_title: sourceForm.source_title || null,
        }),
      },
      "Kaynak eklendi"
    );
    setSourceForm((prev) => ({ ...prev, source_url: "", source_sku: "", source_brand: "", source_title: "" }));
  }

  async function handleSavePricingSettings() {
    if (!product?.id) return;
    const manualOverrideRequested = manualPrice.trim().length > 0;
    const resolvedPriceLocked = manualOverrideRequested && !priceLockTouched ? true : priceLocked;
    const payload: Record<string, unknown> = { price_locked: resolvedPriceLocked };
    if (manualPrice.trim()) {
      payload.manual_price = Number(manualPrice);
      payload.note = manualNote || null;
    }
    await handleSourceAction(
      `/api/pricing/products/${product.id}/settings`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      "Pricing ayarları kaydedildi"
    );
    setManualPrice("");
    setManualNote("");
    setPriceLocked(resolvedPriceLocked);
    setPriceLockTouched(false);
  }

  async function handleSaveRuleOverride() {
    if (!product?.id) return;
    const payload = {
      name: ruleOverride.name,
      rule_type: "product",
      product_id: product.id,
      target_id: null,
      margin_percent: ruleOverride.margin_percent ? Number(ruleOverride.margin_percent) : null,
      min_margin_amount: ruleOverride.min_margin_amount ? Number(ruleOverride.min_margin_amount) : null,
      min_price: ruleOverride.min_price ? Number(ruleOverride.min_price) : null,
      max_price: ruleOverride.max_price ? Number(ruleOverride.max_price) : null,
      rounding_strategy: ruleOverride.rounding_strategy,
      priority: Number(ruleOverride.priority),
      is_active: true,
    };

    if (ruleOverride.id) {
      await handleSourceAction(
        `/api/pricing/rules/${ruleOverride.id}`,
        { method: "PATCH", body: JSON.stringify(payload) },
        "Ürün kuralı güncellendi"
      );
      return;
    }

    await handleSourceAction("/api/pricing/rules", { method: "POST", body: JSON.stringify(payload) }, "Ürün kuralı oluşturuldu");
  }

  if (!product?.id) {
    return (
      <div className={`${ADMIN_CARD} p-4`}>
        <p className={ADMIN_MUTED_TEXT}>Pricing yönetimi ürün kaydedildikten sonra aktif olur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-dark-500 dark:text-dark-400">
          Aktif kaynak: <span className="font-medium text-dark-900 dark:text-dark-50">{selectedSource?.source_site?.name ?? "Tanımlı değil"}</span>
        </p>
        <button onClick={() => void loadData()} className={ADMIN_BTN_SECONDARY}>
          <RefreshCw size={14} />
          Yenile
        </button>
      </div>

      {loading ? <div className={`${ADMIN_CARD} p-4 text-sm text-dark-500 dark:text-dark-400`}>Yükleniyor...</div> : null}

      {!loading && activeTab === "sources" && (
        <div className="space-y-4">
          <div className={`${ADMIN_CARD} p-4`}>
            <h3 className="font-semibold text-dark-900 dark:text-dark-50">Aktif ve Alternatif Kaynaklar</h3>
            <div className="mt-4 space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <PricingSourceStatusBadge status={source.status} />
                        <PricingConfidenceBadge score={source.confidence_score} />
                        <PricingVerificationBadge method={source.verification_method} matchVerified={source.match_verified} />
                        {product.price_source_id === source.id ? <span className="text-xs font-medium text-primary-600">Seçili kaynak</span> : null}
                      </div>
                      <div>
                        <p className="font-medium text-dark-900 dark:text-dark-50">{source.source_site?.name ?? "Kaynak site"}</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">Match: {source.match_score ?? "—"} • Son kontrol: {formatDate(source.last_checked_at)}</p>
                      </div>
                      <a href={source.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
                        <ExternalLink size={14} />
                        Kaynak URL&apos;yi aç
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => void handleSourceAction(`/api/pricing/sources/${source.id}/check`, { method: "POST" }, "Kaynak kontrol edildi")} className={ADMIN_BTN_SECONDARY}>Şimdi kontrol et</button>
                      <button onClick={() => void handleSourceAction(`/api/pricing/sources/${source.id}/verify`, { method: "POST", body: JSON.stringify({ approved: true }) }, "Kaynak onaylandı")} className={ADMIN_BTN_SECONDARY}>Verify</button>
                      <button onClick={() => void handleSourceAction(`/api/pricing/sources/${source.id}/verify`, { method: "POST", body: JSON.stringify({ approved: false }) }, "Kaynak reddedildi")} className={ADMIN_BTN_SECONDARY}>Reject</button>
                      <button onClick={() => void handleSourceAction(`/api/pricing/sources/${source.id}/status`, { method: "POST", body: JSON.stringify({ status: "disabled" }) }, "Kaynak pasife alındı")} className={ADMIN_BTN_SECONDARY}>Disable</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${ADMIN_CARD} p-4`}>
            <h3 className="font-semibold text-dark-900 dark:text-dark-50">Yeni Kaynak Ekle</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select className={ADMIN_SELECT} value={sourceForm.source_site_id} onChange={(e) => setSourceForm((prev) => ({ ...prev, source_site_id: e.target.value }))}>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              <input className={ADMIN_INPUT} placeholder="Kaynak URL" value={sourceForm.source_url} onChange={(e) => setSourceForm((prev) => ({ ...prev, source_url: e.target.value }))} />
              <input className={ADMIN_INPUT} placeholder="Source SKU" value={sourceForm.source_sku} onChange={(e) => setSourceForm((prev) => ({ ...prev, source_sku: e.target.value }))} />
              <input className={ADMIN_INPUT} placeholder="Source Brand" value={sourceForm.source_brand} onChange={(e) => setSourceForm((prev) => ({ ...prev, source_brand: e.target.value }))} />
              <input className="md:col-span-2 w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100" placeholder="Source Title" value={sourceForm.source_title} onChange={(e) => setSourceForm((prev) => ({ ...prev, source_title: e.target.value }))} />
            </div>
            <div className="mt-4">
              <button onClick={() => void handleCreateSource()} className={ADMIN_BTN_PRIMARY}>Kaynak ekle</button>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "pricing" && (
        <div className="space-y-4">
          <div className={`${ADMIN_CARD} p-4`}>
            <h3 className="font-semibold text-dark-900 dark:text-dark-50">Neden bu kaynak?</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                <p className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400">Seçili Kaynak</p>
                <p className="mt-2 font-medium text-dark-900 dark:text-dark-50">{selectedSource?.source_site?.name ?? "Tanımlı değil"}</p>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">{selectedSource?.source_url ?? "Kaynak URL yok"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PricingConfidenceBadge score={selectedSource?.confidence_score ?? 0} />
                  <PricingVerificationBadge method={selectedSource?.verification_method ?? null} matchVerified={Boolean(selectedSource?.match_verified)} />
                  {selectedSource ? <PricingSourceStatusBadge status={selectedSource.status} /> : null}
                </div>
              </div>
              <div className="rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                <p className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400">Karar Özeti</p>
                <p className="mt-2 text-sm text-dark-700 dark:text-dark-200">Match score: {selectedSource?.match_score ?? "—"}</p>
                <p className="mt-1 text-sm text-dark-700 dark:text-dark-200">Son scrape: {formatDate(selectedSource?.last_checked_at)}</p>
                <p className="mt-1 text-sm text-dark-700 dark:text-dark-200">Alternatif kaynak: {alternativeSources.length}</p>
                <p className="mt-1 text-sm text-dark-700 dark:text-dark-200">
                  Fallback adayı: {String(decisions[0]?.metadata?.fallback_candidate_id ?? "yok")}
                </p>
                <p className="mt-1 text-sm text-dark-700 dark:text-dark-200">
                  Son karar: {decisions[0]?.decision_type ?? "Henüz karar kaydı yok"}
                </p>
                <p className="mt-1 text-sm text-dark-700 dark:text-dark-200">
                  Aktif source id: {product.price_source_id ?? "yok"}
                </p>
                <p className="mt-1 text-sm text-dark-700 dark:text-dark-200">
                  Red nedenleri: {decisions[0]?.rejection_reasons?.length ? decisions[0].rejection_reasons.join(", ") : "Yok"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-dark-500 dark:text-dark-400">
              Not: Fallback adayı ile aktif source değişimi aynı şey değildir. Son karar tipi fallback ise aktif kaynak otomatik değişmiş olabilir.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className={`${ADMIN_CARD} p-4`}>
              <h3 className="font-semibold text-dark-900 dark:text-dark-50">Fiyatlandırma Ayarları</h3>
              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-3 rounded-lg border border-dark-100 p-3 dark:border-dark-700">
                  <input
                    type="checkbox"
                    checked={priceLocked}
                    onChange={(e) => {
                      setPriceLocked(e.target.checked);
                      setPriceLockTouched(true);
                    }}
                    className="h-4 w-4 rounded accent-primary-600"
                  />
                  <div>
                    <p className="font-medium text-dark-900 dark:text-dark-50">Price Locked</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">Açıkken otomatik fiyat yazımı engellenir. Manuel override varsayılan olarak ürünü kilitler; isterseniz burada kapatabilirsiniz.</p>
                  </div>
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={ADMIN_INPUT} type="number" min={0} step="0.01" placeholder="Manuel fiyat override" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} />
                  <input className={ADMIN_INPUT} placeholder="Açıklama / not" value={manualNote} onChange={(e) => setManualNote(e.target.value)} />
                </div>
                <button onClick={() => void handleSavePricingSettings()} className={ADMIN_BTN_PRIMARY}>Pricing ayarlarını kaydet</button>
              </div>
            </div>

            <div className={`${ADMIN_CARD} p-4`}>
              <h3 className="font-semibold text-dark-900 dark:text-dark-50">Ürün Bazlı Rule Override</h3>
              <div className="mt-4 grid gap-3">
                <input className={ADMIN_INPUT} placeholder="Kural adı" value={ruleOverride.name} onChange={(e) => setRuleOverride((prev) => ({ ...prev, name: e.target.value }))} />
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={ADMIN_INPUT} placeholder="Margin %" value={ruleOverride.margin_percent} onChange={(e) => setRuleOverride((prev) => ({ ...prev, margin_percent: e.target.value }))} />
                  <input className={ADMIN_INPUT} placeholder="Min marj tutarı" value={ruleOverride.min_margin_amount} onChange={(e) => setRuleOverride((prev) => ({ ...prev, min_margin_amount: e.target.value }))} />
                  <input className={ADMIN_INPUT} placeholder="Min fiyat" value={ruleOverride.min_price} onChange={(e) => setRuleOverride((prev) => ({ ...prev, min_price: e.target.value }))} />
                  <input className={ADMIN_INPUT} placeholder="Max fiyat" value={ruleOverride.max_price} onChange={(e) => setRuleOverride((prev) => ({ ...prev, max_price: e.target.value }))} />
                  <select className={ADMIN_SELECT} value={ruleOverride.rounding_strategy} onChange={(e) => setRuleOverride((prev) => ({ ...prev, rounding_strategy: e.target.value }))}>
                    <option value="none">Yuvarlama yok</option>
                    <option value="round_99">.99 bitir</option>
                    <option value="round_nearest_10">En yakın 10</option>
                  </select>
                  <input className={ADMIN_INPUT} placeholder="Öncelik" value={ruleOverride.priority} onChange={(e) => setRuleOverride((prev) => ({ ...prev, priority: e.target.value }))} />
                </div>
                <button onClick={() => void handleSaveRuleOverride()} className={ADMIN_BTN_SECONDARY}>
                  {ruleOverride.id ? "Override güncelle" : "Override oluştur"}
                </button>
                <p className="text-xs text-dark-500 dark:text-dark-400">Bu bölüm yalnız product-level pricing rule override için kullanılır.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "history" && (
        <div className="space-y-4">
          <div className={`${ADMIN_CARD} p-4`}>
            <h3 className="font-semibold text-dark-900 dark:text-dark-50">Price History</h3>
            <div className="mt-4 space-y-2">
              {historyRows.map((row) => (
                <div key={row.id} className="rounded-lg border border-dark-100 p-3 text-sm dark:border-dark-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-dark-900 dark:text-dark-50">{row.price_type}</div>
                    <div className="text-xs text-dark-500 dark:text-dark-400">{formatDate(row.created_at)}</div>
                  </div>
                  <p className="mt-1 text-dark-600 dark:text-dark-300">
                    {row.old_price != null ? formatPrice(row.old_price) : "—"} → {formatPrice(row.new_price)}
                  </p>
                  <p className="mt-1 text-xs text-dark-500 dark:text-dark-400">{row.change_reason ?? "Açıklama yok"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${ADMIN_CARD} p-4`}>
            <h3 className="font-semibold text-dark-900 dark:text-dark-50">Pricing Decisions ve Son Alarmlar</h3>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                {decisions.map((decision) => (
                  <div key={decision.id} className="rounded-lg border border-dark-100 p-3 text-sm dark:border-dark-700">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-dark-900 dark:text-dark-50">{decision.decision_type}</p>
                      <PricingConfidenceBadge score={decision.confidence_at_decision ?? 0} />
                    </div>
                    <p className="mt-1 text-dark-600 dark:text-dark-300">
                      Final fiyat: {decision.final_price != null ? formatPrice(decision.final_price) : "—"}
                    </p>
                    <p className="mt-1 text-xs text-dark-500 dark:text-dark-400">
                      {decision.price_actually_updated ? "products.price güncellendi" : "products.price güncellenmedi"} • {formatDate(decision.created_at)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-dark-100 p-3 text-sm dark:border-dark-700">
                    <div className="flex items-center justify-between gap-3">
                      <PricingSeverityBadge severity={alert.severity} />
                      <span className="text-xs text-dark-500 dark:text-dark-400">{formatDate(alert.created_at)}</span>
                    </div>
                    <p className="mt-2 text-dark-700 dark:text-dark-200">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
