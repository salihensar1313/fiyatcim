// ==========================================
// CORE TYPES
// ==========================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at?: string;
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
  created_at?: string;
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
  notes: string | null;
  coupon_id: string | null;
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
