// ==========================================
// ADMIN PANEL TYPES
// ==========================================

export type DateRange = "today" | "7d" | "30d" | "all";

export type ActivityLogType =
  | "order_status"
  | "product_create"
  | "product_update"
  | "product_delete"
  | "review_approve"
  | "review_reject"
  | "bulk_order_update"
  | "tracking_added"
  | "stock_update"
  | "return_request";

export interface ActivityLogEntry {
  id: string;
  type: ActivityLogType;
  message: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface RevenuePoint {
  date: string;      // "2026-03-07" or "Pzt", "Sal" etc.
  revenue: number;
  orderCount: number;
}

export interface OrderStatusPoint {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface CategorySalesPoint {
  category: string;
  revenue: number;
  count: number;
}

export interface DashboardStat {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  sparklineData?: number[];
  href?: string;
  icon: string; // lucide icon name reference
}
