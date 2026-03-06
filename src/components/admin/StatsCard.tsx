import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export default function StatsCard({ label, value, change, changeType = "neutral", icon: Icon }: StatsCardProps) {
  const changeColors = {
    positive: "text-green-600 bg-green-50",
    negative: "text-red-600 bg-red-50",
    neutral: "text-dark-500 dark:text-dark-400 bg-dark-50",
  };

  return (
    <div className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-dark-500 dark:text-dark-400">{label}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold text-dark-900 dark:text-dark-50">{value}</span>
        {change && (
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
