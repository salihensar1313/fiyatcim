"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { OrderStatusPoint } from "@/types/admin";
import { ShoppingBag } from "lucide-react";

interface OrdersStatusChartProps {
  data: OrderStatusPoint[];
  title?: string;
}

export default function OrdersStatusChart({ data, title = "Sipariş Durumları" }: OrdersStatusChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-dark-400 dark:text-dark-500">
        <ShoppingBag size={40} className="mb-2 opacity-30" />
        <p className="text-sm">Henüz sipariş yok</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-dark-900 dark:text-dark-50">{title}</h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(17,24,39,0.9)",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [value, "Sipariş"]}
              labelStyle={{ color: "#9ca3af" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
