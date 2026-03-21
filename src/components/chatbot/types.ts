// ============================================================
// CimBot V2 — Type Definitions
// AI-Level Chatbot for Fiyatcim.com
// ============================================================

import type { Product } from "@/types";

// ─── Intent Types ───
export type Intent =
  | "GREETING"
  | "FAREWELL"
  | "THANKS"
  | "PRODUCT_SEARCH"
  | "BUDGET"
  | "CATEGORY"
  | "BRAND"
  | "COMPARE"
  | "CART_ADD"
  | "CART_VIEW"
  | "ORDER_TRACK"
  | "SUPPORT"
  | "INSTALL"
  | "PRICING"
  | "DISCOUNT"
  | "SPECS"
  | "RECOMMEND"
  | "CASUAL"
  | "PROFANITY"
  | "ANGRY_CHALLENGE"
  | "REFINE_CHEAPER"
  | "REFINE_EXPENSIVE"
  | "REFINE_DIFFERENT"
  | "SHOW_MORE"
  | "STOCK_CHECK"
  | "SHIPPING_INFO"
  | "PACKAGE_DEAL"
  | "SELECT_PRODUCT"
  | "UNKNOWN";

// ─── Sentiment ───
export type Sentiment = "positive" | "neutral" | "negative" | "angry";

// ─── Entity Types ───
export interface BudgetEntity {
  min?: number;
  max?: number;
  exact?: number;
}

export interface ExtractedEntities {
  budget: BudgetEntity | null;
  category: string | null;      // category slug
  categoryName: string | null;  // display name
  brand: string | null;         // brand slug
  brandName: string | null;     // display name
  quantity: number | null;
  specs: Record<string, string>;
  productIndex: number | null;  // "ilkini", "ikincisini" → 0, 1
}

// ─── NLP Result ───
export interface NLPResult {
  intents: Intent[];         // Multiple intents possible
  primaryIntent: Intent;
  entities: ExtractedEntities;
  sentiment: Sentiment;
  confidence: number;        // 0-1
  rawText: string;
  normalizedText: string;
}

// ─── Conversation State ───
export type ConversationState =
  | "IDLE"
  | "GREETING"
  | "NEEDS_ASSESSMENT"
  | "ASK_BUDGET"
  | "ASK_CATEGORY"
  | "ASK_USAGE"           // iç/dış mekan, ev/iş yeri
  | "PRODUCT_DISCOVERY"
  | "SHOWING_PRODUCTS"
  | "COMPARISON"
  | "CART_ACTION"
  | "ORDER_TRACKING"
  | "SUPPORT_FLOW"
  | "ANGRY_MODE"
  | "FAREWELL";

// ─── Conversation Context ───
export interface ConversationContext {
  state: ConversationState;
  budget: BudgetEntity | null;
  preferredCategory: string | null;
  preferredCategoryName: string | null;
  preferredBrand: string | null;
  preferredBrandName: string | null;
  preferredSpecs: Record<string, string>;
  usage: "indoor" | "outdoor" | "both" | null;
  lastShownProducts: Product[];
  lastQuery: string;
  turnCount: number;
  sentiment: Sentiment;
  isAngry: boolean;
  challengeId: string | null;
  cartSuggestionShown: boolean;
  needsStep?: number;       // Sales funnel step: 1=usage, 2=quantity, 3=budget
  cameraCount?: string;     // "1-2", "4", "8", "16+"
  showMoreOffset: number;   // Pagination: how many products already shown
  allShownProductIds: string[]; // All product IDs shown in this session (for excludeIds)
}

// ─── Message Types ───
export interface BotAction {
  label: string;
  icon?: "link" | "phone" | "email" | "cart" | "search";
  type: "navigate" | "phone" | "email" | "quick_reply" | "add_to_cart";
  href?: string;
  productId?: string;
  value?: string;   // for quick_reply
}

export interface ProductCard {
  product: Product;
  showAddToCart?: boolean;
}

export interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text: string;
  timestamp: Date;
  actions?: BotAction[];
  products?: ProductCard[];      // inline product carousel
  quickReplies?: QuickReply[];   // context-aware buttons
  isRead?: boolean;
}

export interface QuickReply {
  label: string;
  value: string;
  icon?: string;   // emoji
}

// ─── Product Query Filters ───
export interface ProductFilters {
  budget?: BudgetEntity;
  categorySlug?: string;
  brandSlug?: string;
  onSale?: boolean;
  specs?: Record<string, string>;
  searchText?: string;        // Full-text search in name/description
  sort?: "price_asc" | "price_desc" | "popular" | "newest" | "best_value";
  limit?: number;
  offset?: number;            // For pagination
  excludeIds?: string[];
}

// ─── Bot Response ───
export interface BotResponse {
  text: string;
  actions?: BotAction[];
  products?: ProductCard[];
  quickReplies?: QuickReply[];
  newState?: ConversationState;
  updateContext?: Partial<ConversationContext>;
  isAngry?: boolean;
  forgiven?: boolean;
}

// ─── Challenge (Angry mode) ───
export interface Challenge {
  id: string;
  instruction: string;
  matchPattern: RegExp;
  hint: string;
  forgiveResponse: string;
}

// ─── Knowledge Entry ───
export interface KnowledgeEntry {
  topic: string;
  keywords: string[];
  content: string;
  relatedCategories?: string[];
}
