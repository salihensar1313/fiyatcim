// ==========================================
// CORE TYPES
// ==========================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  product_count?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  brand_id: string;
  price: number;
  sale_price: number | null;
  price_usd: number;
  sale_price_usd: number | null;
  stock: number;
  critical_stock: number;
  tax_rate: number;
  warranty_months: number;
  shipping_type: "kargo" | "kurulum";
  is_active: boolean;
  deleted_at: string | null;
  short_desc: string;
  description: string;
  specs: Record<string, string>;
  images: string[];
  seo_title: string;
  sale_ends_at?: string; // ISO date — flash sale bitis zamani
  cost_price?: number | null;
  cost_currency?: string | null;
  price_source_id?: string | null;
  price_locked?: boolean;
  last_price_update?: string | null;
  is_featured: boolean;
  is_trending: boolean;
  seo_desc: string;
  created_at: string;
  updated_at?: string;
  // Joined fields
  category?: Category;
  brand?: Brand;
  reviews?: Review[];
}

export interface Profile {
  user_id: string;
  ad: string;
  soyad: string;
  telefon: string;
  role: "user" | "admin";
  avatar?: string;
  is_premium?: boolean;
  premium_expires_at?: string;
  created_at?: string;
}

export interface PremiumMembership {
  id: string;
  user_id: string;
  status: "active" | "expired" | "cancelled";
  purchased_with_order_id?: string | null;
  price_paid: number;
  payment_method: "with_order" | "standalone" | "admin_granted";
  purchased_at: string;
  expires_at?: string | null;
  cancelled_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  ad: string;
  soyad: string;
  telefon: string;
  il: string;
  ilce: string;
  adres: string;
  posta_kodu: string;
}

export type InvoiceType = "bireysel" | "kurumsal";

export interface InvoiceInfo {
  wantsInvoice: boolean;
  invoiceType: InvoiceType;
  companyName?: string;    // kurumsal — şirket ünvanı
  taxOffice?: string;      // kurumsal — vergi dairesi
  taxNumber?: string;      // kurumsal — vergi no (10 hane)
  tcKimlik?: string;       // bireysel — TC kimlik no (11 hane)
  fullName?: string;       // bireysel — ad soyad
}

export interface SavedAddress extends Address {
  id: string;
  baslik: string;
  user_id: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_provider: "iyzico" | "paytr" | null;
  payment_ref: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  shipping_address: Address;
  billing_address: Address;
  shipping_company: string | null;
  tracking_no: string | null;
  customer_email?: string;
  notes: string | null;
  coupon_id: string | null;
  invoice_info?: InvoiceInfo;
  created_at: string;
  updated_at?: string;
  // Joined
  items?: OrderItem[];
  status_logs?: OrderStatusLog[];
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "refunded";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name_snapshot: string;
  price_snapshot: number;
  sale_price_snapshot: number | null;
  tax_rate_snapshot: number;
  tax_amount: number;
  discount_amount: number;
  qty: number;
  // Joined
  product?: Product;
}

export interface OrderStatusLog {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_cart: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expiry: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  images?: string[]; // base64 fotoğraflar (max 3)
  is_approved: boolean;
  created_at: string;
  helpful_yes: number;
  helpful_no: number;
  // Joined
  profile?: Profile;
}

export interface ReviewVote {
  review_id: string;
  user_id: string;
  vote: "yes" | "no";
}

export interface Question {
  id: string;
  product_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  answered_by: string | null;
  created_at: string;
  answered_at: string | null;
  profile?: Profile;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

// ==========================================
// PRICING TYPES
// ==========================================

export type PriceSourceStatus =
  | "active"
  | "fallback_candidate"
  | "blocked"
  | "not_found"
  | "invalid_match"
  | "manual_review"
  | "disabled";

export type PriceSourceVerificationMethod = "auto" | "manual" | null;
export type PriceHistoryType = "source_cost" | "sale_price" | "manual_override";
export type PricingRuleType = "global" | "brand" | "category" | "product";
export type PricingRoundingStrategy = "none" | "round_99" | "round_nearest_10";
export type PriceAlertSeverity = "info" | "warning" | "critical";
export type SourceScrapeLogStatus = "success" | "blocked" | "not_found" | "failed" | "manual_review";
export type PricingDecisionType = "auto_update" | "fallback" | "manual_override" | "rule_change";
export type PricingJobType = "batch_scrape" | "batch_price_update" | "batch_margin_change" | "csv_import";
export type PricingJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface SourceSite {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
  priority: number;
  rate_limit_ms: number;
  selectors: Record<string, unknown>;
  extractor_config: Record<string, unknown>;
  headers: Record<string, string>;
  health_score: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  failure_count: number;
  total_scrapes_30d: number;
  successful_scrapes_30d: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceSource {
  id: string;
  product_id: string;
  source_site_id: string;
  source_url: string;
  source_sku: string | null;
  source_brand: string | null;
  source_title: string | null;
  status: PriceSourceStatus;
  match_verified: boolean;
  verification_method: PriceSourceVerificationMethod;
  match_score: number | null;
  manual_review_required: boolean;
  review_reason: string | null;
  last_price: number | null;
  last_price_currency: string | null;
  last_checked_at: string | null;
  last_success_at: string | null;
  confidence_score: number;
  failure_count: number;
  check_interval_hours: number;
  custom_selectors: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
  source_site?: SourceSite;
}

export interface PriceHistoryRecord {
  id: string;
  product_id: string;
  source_id: string | null;
  price_type: PriceHistoryType;
  old_price: number | null;
  new_price: number;
  currency: string | null;
  change_percent: number | null;
  change_reason: string | null;
  changed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PricingRule {
  id: string;
  name: string;
  rule_type: PricingRuleType;
  target_id: string | null;
  product_id: string | null;
  margin_percent: number | null;
  min_margin_amount: number | null;
  max_price: number | null;
  min_price: number | null;
  rounding_strategy: PricingRoundingStrategy;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceAlert {
  id: string;
  product_id: string;
  source_id: string | null;
  alert_type: string;
  severity: PriceAlertSeverity;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface SourceScrapeLog {
  id: string;
  source_id: string;
  status: SourceScrapeLogStatus;
  http_status: number | null;
  response_time_ms: number | null;
  extractor_used: string | null;
  extracted_price: number | null;
  extracted_title: string | null;
  extracted_brand: string | null;
  extracted_sku: string | null;
  title_match_score: number | null;
  error_message: string | null;
  raw_html_snippet: string | null;
  created_at: string;
}

export interface PricingDecision {
  id: string;
  product_id: string;
  selected_source_id: string | null;
  source_price: number | null;
  source_currency: string | null;
  applied_rule_id: string | null;
  margin_percent_applied: number | null;
  calculated_price: number | null;
  final_price: number | null;
  decision_type: PricingDecisionType;
  confidence_at_decision: number | null;
  rejection_reasons: string[];
  was_price_locked: boolean;
  price_actually_updated: boolean;
  decided_by: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PricingJob {
  id: string;
  type: PricingJobType;
  status: PricingJobStatus;
  started_at: string | null;
  finished_at: string | null;
  total_items: number;
  processed_items: number;
  success_count: number;
  failure_count: number;
  skipped_count: number;
  triggered_by: string | null;
  filters: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ==========================================
// PRICE HISTORY TYPES
// ==========================================

export interface PriceHistoryEntry {
  productId: string;
  price: number;
  priceUsd: number;
  recordedAt: string; // ISO date string
}

export interface PriceStats {
  lowest: number;
  highest: number;
  average: number;
  current: number;
  change7d: number | null; // percentage change in last 7 days
  change30d: number | null;
  lowestDate: string | null;
  highestDate: string | null;
}

// ==========================================
// CART TYPES
// ==========================================

export interface CartItem {
  product_id: string;
  qty: number;
  // Enriched from product data
  product?: Product;
  // Gift wrap
  giftWrap?: boolean;
  giftMessage?: string;
}

export interface CartState {
  items: CartItem[];
  coupon_code: string | null;
}

// ==========================================
// UI TYPES
// ==========================================

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  comment: string;
  rating: number;
  avatar?: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta_text: string;
  cta_link: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface TrustBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
}

// ==========================================
// FILTER / SORT TYPES
// ==========================================

export interface ProductFilters {
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
  search?: string;
  page?: number;
}

export type ViewMode = "grid" | "list";

// ==========================================
// STATUS LABEL MAPS
// ==========================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Ödeme Bekleniyor",
  paid: "Ödeme Alındı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
  refunded: "İade Edildi",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Bekliyor",
  success: "Başarılı",
  failed: "Başarısız",
  refunded: "İade Edildi",
};

// ==========================================
// RETURN (İADE) TYPES
// ==========================================

export type ReturnReason =
  | "defective"
  | "wrong_item"
  | "changed_mind"
  | "damaged"
  | "other";

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  defective: "Arızalı / Kusurlu Ürün",
  wrong_item: "Yanlış Ürün Gönderildi",
  changed_mind: "Fikir Değişikliği",
  damaged: "Hasarlı / Kırık Ürün",
  other: "Diğer",
};

export type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  completed: "Tamamlandı",
};

export interface ReturnRequestItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  items: ReturnRequestItem[];
  reason: ReturnReason;
  description?: string;
  status: ReturnStatus;
  requestedAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  refundAmount?: number;
  notes?: string;
}

