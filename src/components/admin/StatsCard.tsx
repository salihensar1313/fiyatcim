"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  sparklineData?: number[];
  href?: string;
}

function SparkLine({ data }: { data: number[] }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="#DC2626"
            strokeWidth={1.5}
            fill="url(#sparkGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function StatsCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  sparklineData,
  href,
}: StatsCardProps) {
  const changeColors = {
    positive: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400",
    negative: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400",
    neutral: "text-dark-500 bg-dark-50 dark:bg-dark-700 dark:text-dark-400",
  };

  const TrendIcon = changeType === "positive" ? TrendingUp : changeType === "negative" ? TrendingDown : null;

  const content = (
    <div
      className={`rounded-xl border border-dark-100 bg-white p-5 transition-shadow dark:border-dark-700 dark:bg-dark-800 ${
        href ? "cursor-pointer hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span className="text-sm font-medium text-dark-500 dark:text-dark-400">{label}</span>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-2xl font-bold text-dark-900 dark:text-dark-50">{value}</span>
            {sparklineData && sparklineData.length > 1 && <SparkLine data={sparklineData} />}
          </div>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              {TrendIcon && <TrendIcon size={12} />}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${changeColors[changeType]}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
