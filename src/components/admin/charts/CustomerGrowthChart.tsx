"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  customers: { created_at?: string }[];
}

export default function CustomerGrowthChart({ customers }: Props) {
  const data = useMemo(() => {
    const now = Date.now();
    const days = 30;
    const result: { date: string; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now - (i + 1) * 86400000);
      const dayEnd = new Date(now - i * 86400000);
      const label = `${dayStart.getDate()}/${dayStart.getMonth() + 1}`;

      const count = customers.filter((c) => {
        if (!c.created_at) return false;
        const t = new Date(c.created_at).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      }).length;

      result.push({ date: label, count });
    }
    return result;
  }, [customers]);

  const hasData = data.some((d) => d.count > 0);

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-dark-900 dark:text-dark-50">Müşteri Büyümesi</h4>
      {hasData ? (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                className="fill-dark-400 dark:fill-dark-500"
              />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} className="fill-dark-400 dark:fill-dark-500" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}
                formatter={(v) => [`${v} kayıt`, "Yeni Müşteri"]}
              />
              <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={1.5} fill="url(#custGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-dark-400 dark:text-dark-500">Son 30 günde yeni kayıt yok</p>
      )}
    </div>
  );
}
