"use client";

import { useMemo } from "react";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { formatPrice, formatDate } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus, Calendar, BarChart3 } from "lucide-react";

interface PriceHistoryChartProps {
  productId: string;
  currentPrice: number;
  compact?: boolean; // For public page vs tab
}

export default function PriceHistoryChart({ productId, currentPrice, compact = false }: PriceHistoryChartProps) {
  const { history, stats, period, setPeriod, hasData } = usePriceHistory(productId, currentPrice);

  // SVG chart dimensions
  const width = compact ? 500 : 700;
  const height = compact ? 200 : 250;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate chart points
  const chartData = useMemo(() => {
    if (history.length === 0) return null;

    // Include current price as the last point
    const allEntries = [
      ...history,
      { productId, price: currentPrice, priceUsd: 0, recordedAt: new Date().toISOString() },
    ];

    const prices = allEntries.map((e) => e.price);
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const priceRange = maxPrice - minPrice || 1;

    const startTime = new Date(allEntries[0].recordedAt).getTime();
    const endTime = new Date(allEntries[allEntries.length - 1].recordedAt).getTime();
    const timeRange = endTime - startTime || 1;

    const points = allEntries.map((entry) => {
      const time = new Date(entry.recordedAt).getTime();
      const x = padding.left + ((time - startTime) / timeRange) * chartWidth;
      const y = padding.top + (1 - (entry.price - minPrice) / priceRange) * chartHeight;
      return { x, y, price: entry.price, date: entry.recordedAt };
    });

    // Polyline path
    const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

    // Area path (for gradient fill)
    const areaPath = `M ${points[0].x},${padding.top + chartHeight} ` +
      points.map((p) => `L ${p.x},${p.y}`).join(" ") +
      ` L ${points[points.length - 1].x},${padding.top + chartHeight} Z`;

    // Y-axis labels (5 ticks)
    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const price = minPrice + (priceRange * i) / 4;
      const y = padding.top + chartHeight - (chartHeight * i) / 4;
      return { price, y };
    });

    return { points, polyline, areaPath, yLabels, minPrice, maxPrice };
  }, [history, currentPrice, productId, chartWidth, chartHeight, padding.left, padding.top]);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="mb-3 text-dark-300" size={48} />
        <p className="text-lg font-medium text-dark-600 dark:text-dark-300">Fiyat takibi başladı</p>
        <p className="mt-1 text-sm text-dark-400">
          Henüz yeterli veri yok. Fiyat değişimleri kaydedilmeye başlandı, yakında grafik hazır olacak.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h3 className={compact ? "text-base font-semibold text-dark-800 dark:text-dark-100" : "text-lg font-semibold text-dark-800 dark:text-dark-100"}>
          Fiyat Geçmişi
        </h3>
        <div className="flex gap-1 rounded-lg bg-dark-100 p-1">
          {([30, 90, 180] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-white dark:bg-dark-800 text-dark-800 dark:text-dark-100 shadow-sm"
                  : "text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200"
              }`}
            >
              {p} Gün
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      {chartData && (
        <div className="overflow-hidden rounded-lg border border-dark-200 bg-white dark:border-dark-600 dark:bg-dark-800">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id={`gradient-${productId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {chartData.yLabels.map((label, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={label.y}
                  x2={width - padding.right}
                  y2={label.y}
                  stroke="#e5e7eb"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={label.y + 4}
                  textAnchor="end"
                  className="fill-dark-400"
                  fontSize={11}
                >
                  {formatPrice(label.price)}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path d={chartData.areaPath} fill={`url(#gradient-${productId})`} />

            {/* Line */}
            <polyline
              points={chartData.polyline}
              fill="none"
              stroke="#ef4444"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Data points */}
            {chartData.points.map((point, i) => (
              <g key={i}>
                <circle cx={point.x} cy={point.y} r={3} fill="#ef4444" stroke="white" strokeWidth={2} />
                <title>
                  {formatPrice(point.price)} - {new Date(point.date).toLocaleDateString("tr-TR")}
                </title>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="En Düşük"
            value={formatPrice(stats.lowest)}
            sub={stats.lowestDate ? formatDate(stats.lowestDate) : undefined}
            icon={<TrendingDown size={16} className="text-green-500" />}
          />
          <StatCard
            label="En Yüksek"
            value={formatPrice(stats.highest)}
            sub={stats.highestDate ? formatDate(stats.highestDate) : undefined}
            icon={<TrendingUp size={16} className="text-red-500" />}
          />
          <StatCard
            label="Ortalama"
            value={formatPrice(stats.average)}
            icon={<Minus size={16} className="text-dark-400" />}
          />
          <StatCard
            label="Son 7 Gün"
            value={
              stats.change7d !== null
                ? `${stats.change7d > 0 ? "+" : ""}${stats.change7d}%`
                : "—"
            }
            valueColor={
              stats.change7d !== null
                ? stats.change7d < 0
                  ? "text-green-600"
                  : stats.change7d > 0
                    ? "text-red-600"
                    : "text-dark-600 dark:text-dark-300"
                : "text-dark-400"
            }
            icon={<Calendar size={16} className="text-blue-500" />}
          />
        </div>
      )}

      {/* SEO content block (for public page) */}
      {!compact && stats && (
        <div className="rounded-lg bg-dark-50 p-4 text-sm text-dark-600 dark:text-dark-300">
          <p>
            Bu ürün son {period} günde{" "}
            {stats.change30d !== null ? (
              stats.change30d < 0 ? (
                <span className="font-medium text-green-600">%{Math.abs(stats.change30d)} ucuzladı</span>
              ) : stats.change30d > 0 ? (
                <span className="font-medium text-red-600">%{stats.change30d} pahalılaştı</span>
              ) : (
                <span className="font-medium">fiyat değişmedi</span>
              )
            ) : (
              <span>yeterli veri bulunmuyor</span>
            )}
            . En düşük fiyat <strong>{formatPrice(stats.lowest)}</strong>
            {stats.lowestDate && ` olarak ${formatDate(stats.lowestDate)} tarihinde`} görüldü.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  valueColor = "text-dark-800 dark:text-dark-100",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="rounded-lg border border-dark-200 bg-white dark:border-dark-600 dark:bg-dark-800 p-3">
      <div className="flex items-center gap-1.5 text-xs text-dark-500 dark:text-dark-400">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-sm font-bold ${valueColor}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-dark-400">{sub}</div>}
    </div>
  );
}
