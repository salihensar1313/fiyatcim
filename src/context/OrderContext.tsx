"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Order, OrderStatus, OrderItem, OrderStatusLog, CartItem, Address, PaymentStatus, InvoiceInfo } from "@/types";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

// ==========================================
// TYPES
// ==========================================

interface CreateOrderParams {
  items: CartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  user: { id: string; email: string } | null;
  customerName?: { ad: string; soyad: string };
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string | null;
  invoiceInfo?: InvoiceInfo;
  premiumSetup?: boolean;
}

interface OrderContextType {
  orders: Order[];
  createOrder: (params: CreateOrderParams) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  getOrdersByUser: (userId: string) => Order[];
  getAllOrders: () => Order[];
  getOrderByNo: (orderNo: string) => Order | undefined;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = "fiyatcim_orders";
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ==========================================
// HELPERS
// ==========================================

function generateOrderNo(customerName?: { ad: string; soyad: string }): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;

  const initials = customerName
    ? (customerName.ad.charAt(0) + customerName.soyad.charAt(0)).toUpperCase()
    : "XX";

  return `FC-${initials}-${yy}${mm}${dd}-${rand}`;
}

function generateId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Fire-and-forget order confirmation email
function sendOrderEmail(order: Order, email: string, customerName: string) {
  const items = (order.items || []).map((item) => ({
    name: item.name_snapshot,
    quantity: item.qty,
    price: item.sale_price_snapshot ?? item.price_snapshot,
  }));

  const addr = order.shipping_address;
  const shippingAddress = addr
    ? `${addr.ad} ${addr.soyad}, ${addr.adres}, ${addr.ilce}/${addr.il}`
    : "";

  fetch("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "order_confirmation",
      to: email,
      data: {
        orderNo: order.order_no,
        customerName,
        items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        shippingAddress,
      },
    }),
  }).catch((err) => logger.error("order_email_failed", { fn: "sendOrderEmail", error: err instanceof Error ? err.message : String(err) }));
}

// Map Supabase order row to Order type
function mapSupabaseOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    order_no: row.order_no as string,
    user_id: row.user_id as string,
    status: row.status as OrderStatus,
    payment_status: ((row.payment_status as string) || "pending") as PaymentStatus,
    payment_provider: (row.payment_provider as "iyzico" | "paytr" | null) || null,
    payment_ref: (row.payment_ref as string | null) || null,
    subtotal: Number(row.subtotal) || 0,
    shipping: Number(row.shipping) || 0,
    discount: Number(row.discount) || 0,
    total: Number(row.total) || 0,
    currency: (row.currency as string) || "TRY",
    shipping_address: (row.shipping_address as Address) || { ad: "", soyad: "", telefon: "", il: "", ilce: "", adres: "", posta_kodu: "" },
    billing_address: (row.billing_address as Address) || { ad: "", soyad: "", telefon: "", il: "", ilce: "", adres: "", posta_kodu: "" },
    shipping_company: (row.shipping_company as string | null) || null,
    tracking_no: (row.tracking_no as string | null) || null,
    notes: (row.notes as string | null) || null,
    coupon_id: (row.coupon_id as string | null) || null,
    created_at: row.created_at as string,
    items: Array.isArray(row.order_items) ? (row.order_items as OrderItem[]) : [],
    status_logs: Array.isArray(row.order_status_logs) ? (row.order_status_logs as OrderStatusLog[]) : [],
  };
}

// ==========================================
// PROVIDER
// ==========================================

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // ========================================
  // LOAD ORDERS
  // ========================================
  const loadOrders = useCallback(async () => {
    if (IS_DEMO) {
      const data = safeGetJSON<Order[]>(ORDERS_STORAGE_KEY, []);
      const validOrders = Array.isArray(data)
        ? data.filter((o): o is Order => typeof o === "object" && o !== null && "id" in o && "order_no" in o)
        : [];
      setOrders(validOrders);
      setIsLoaded(true);
      return;
    }

    // Non-demo: Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setOrders([]);
      setIsLoaded(true);
      return;
    }

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    let query = supabase
      .from("orders")
      .select("*, order_items(*), order_status_logs(*)")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("order_load_failed", { fn: "loadOrders", error: error.message });
      setOrders([]);
    } else {
      setOrders((data ?? []).map((row) => mapSupabaseOrder(row as Record<string, unknown>)));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Save to localStorage in demo mode
  useEffect(() => {
    if (!IS_DEMO || !isLoaded) return;
    safeSetJSON(ORDERS_STORAGE_KEY, orders);
  }, [orders, isLoaded]);

  // ========================================
  // CREATE ORDER
  // ========================================
  const createOrder = useCallback(async (params: CreateOrderParams): Promise<Order> => {
    if (IS_DEMO) {
      // Demo mode: local order creation
      const now = new Date().toISOString();
      const orderId = generateId();

      const orderItems: OrderItem[] = params.items.map((item) => ({
        id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order_id: orderId,
        product_id: item.product_id,
        name_snapshot: item.product?.name || "Ürün",
        price_snapshot: item.product?.price || 0,
        sale_price_snapshot: item.product?.sale_price || null,
        tax_rate_snapshot: item.product?.tax_rate || 20,
        tax_amount: 0,
        discount_amount: 0,
        qty: item.qty,
        product: item.product,
      }));

      // Server-side recalculation: don't trust client-sent totals
      const recalcSubtotal = params.items.reduce((sum, item) => {
        const price = item.product?.sale_price || item.product?.price || 0;
        return sum + price * item.qty;
      }, 0);
      const FREE_SHIPPING_THRESHOLD = 2000;
      const SHIPPING_COST = 49.90;
      const recalcShipping = recalcSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      // Use client-sent discount (coupon validation would be done separately)
      const recalcDiscount = Math.min(Math.max(0, params.discount), recalcSubtotal);
      const premiumCost = params.premiumSetup ? 2500 : 0;
      const recalcTotal = Math.max(0, recalcSubtotal - recalcDiscount + recalcShipping + premiumCost);

      const initialLog: OrderStatusLog = {
        id: `log-${Date.now()}`,
        order_id: orderId,
        old_status: null,
        new_status: "paid",
        changed_by: params.user?.email || "misafir",
        created_at: now,
      };

      const order: Order = {
        id: orderId,
        order_no: generateOrderNo(params.customerName),
        user_id: params.user?.id || "",
        status: "paid",
        payment_status: "success",
        payment_provider: null,
        payment_ref: null,
        subtotal: recalcSubtotal,
        shipping: recalcShipping,
        discount: recalcDiscount,
        total: recalcTotal,
        currency: "TRY",
        shipping_address: params.shippingAddress,
        billing_address: params.billingAddress,
        shipping_company: null,
        tracking_no: null,
        customer_email: params.user?.email || "",
        notes: params.premiumSetup ? "PREMIUM KURULUM DESTEĞİ DAHİL (₺2.500)" : null,
        coupon_id: params.couponCode,
        invoice_info: params.invoiceInfo,
        created_at: now,
        items: orderItems,
        status_logs: [initialLog],
      };

      setOrders((prev) => [order, ...prev]);

      if (params.user?.email) {
        const name = params.customerName
          ? `${params.customerName.ad} ${params.customerName.soyad}`
          : "Değerli Müşterimiz";
        sendOrderEmail(order, params.user.email, name);
      }

      return order;
    }

    // Non-demo: Supabase RPC
    const supabase = createClient();

    const cartItems = params.items.map((item) => ({
      product_id: item.product_id,
      qty: item.qty,
    }));

    const { data, error } = await supabase.rpc("create_order_rpc", {
      p_cart_items: cartItems,
      p_shipping_address: params.shippingAddress,
      p_billing_address: params.billingAddress,
      p_coupon_code: params.couponCode || null,
      p_notes: null,
    });

    if (error) {
      logger.error("order_create_rpc_failed", { fn: "createOrder", error: error.message });
      throw new Error(error.message);
    }

    // RPC returns the order_id
    const orderId = typeof data === "string" ? data : (data as Record<string, unknown>)?.id as string;
    if (!orderId) throw new Error("Sipariş oluşturuldu ancak ID alınamadı");

    // Fetch the full order with items
    const { data: orderData } = await supabase
      .from("orders")
      .select("*, order_items(*), order_status_logs(*)")
      .eq("id", orderId)
      .single();

    const order = orderData
      ? mapSupabaseOrder(orderData as Record<string, unknown>)
      : {
          id: orderId,
          order_no: "",
          user_id: params.user?.id || "",
          status: "pending" as OrderStatus,
          payment_status: "pending" as PaymentStatus,
          payment_provider: null,
          payment_ref: null,
          subtotal: params.subtotal,
          shipping: params.shipping,
          discount: params.discount,
          total: params.total,
          currency: "TRY",
          shipping_address: params.shippingAddress,
          billing_address: params.billingAddress,
          shipping_company: null,
          tracking_no: null,
          notes: null,
          coupon_id: params.couponCode,
          created_at: new Date().toISOString(),
          items: [],
          status_logs: [],
        };

    setOrders((prev) => [order, ...prev]);

    if (params.user?.email) {
      const name = params.customerName
        ? `${params.customerName.ad} ${params.customerName.soyad}`
        : "Değerli Müşterimiz";
      sendOrderEmail(order, params.user.email, name);
    }

    return order;
  }, []);

  // ========================================
  // UPDATE ORDER STATUS
  // ========================================
  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    if (IS_DEMO) {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          const log: OrderStatusLog = {
            id: `log-${Date.now()}`,
            order_id: orderId,
            old_status: order.status,
            new_status: newStatus,
            changed_by: "admin",
            created_at: new Date().toISOString(),
          };
          return {
            ...order,
            status: newStatus,
            updated_at: new Date().toISOString(),
            status_logs: [...(order.status_logs || []), log],
          };
        })
      );
      return;
    }

    // Non-demo: Supabase update
    const supabase = createClient();
    supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .then(({ error }) => {
        if (error) {
          logger.error("order_status_update_failed", { fn: "updateOrderStatus", error: error.message });
          return;
        }
        // Update local state
        setOrders((prev) =>
          prev.map((order) => {
            if (order.id !== orderId) return order;
            return { ...order, status: newStatus };
          })
        );
      });
  }, []);

  // Kullanıcı siparişleri
  const getOrdersByUser = useCallback(
    (userId: string) => orders.filter((o) => o.user_id === userId),
    [orders]
  );

  // Tüm siparişler (admin)
  const getAllOrders = useCallback(() => orders, [orders]);

  // Sipariş numarasına göre bul
  const getOrderByNo = useCallback(
    (orderNo: string) => orders.find((o) => o.order_no === orderNo),
    [orders]
  );

  // Refresh orders from Supabase
  const refreshOrders = useCallback(async () => {
    await loadOrders();
  }, [loadOrders]);

  return (
    <OrderContext.Provider
      value={{ orders, createOrder, updateOrderStatus, getOrdersByUser, getAllOrders, getOrderByNo, refreshOrders }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
