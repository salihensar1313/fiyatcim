"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CategorySalesPoint } from "@/types/admin";
import { formatPrice } from "@/lib/utils";
import { Grid3x3 } from "lucide-react";

interface CategoryPieChartProps {
  data: CategorySalesPoint[];
  title?: string;
}

const COLORS = ["#DC2626", "#2563EB", "#16A34A", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

export default function CategoryPieChart({ data, title = "Kategori Dağılımı" }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] flex-col items-center justify-center text-dark-400 dark:text-dark-500">
        <Grid3x3 size={40} className="mb-2 opacity-30" />
        <p className="text-sm">Henüz veri yok</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-dark-900 dark:text-dark-50">{title}</h3>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="revenue"
              nameKey="category"
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(17,24,39,0.9)",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [formatPrice(Number(value)), "Gelir"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-1.5">
        {data.map((item, idx) => (
          <div key={item.category} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-dark-600 dark:text-dark-300">{item.category}</span>
            </div>
            <span className="font-medium text-dark-900 dark:text-dark-100">
              %{total > 0 ? Math.round((item.revenue / total) * 100) : 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
