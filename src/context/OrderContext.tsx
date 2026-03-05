"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Order, OrderStatus, OrderItem, OrderStatusLog, CartItem, Address } from "@/types";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

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
}

interface OrderContextType {
  orders: Order[];
  createOrder: (params: CreateOrderParams) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  getOrdersByUser: (userId: string) => Order[];
  getAllOrders: () => Order[];
  getOrderByNo: (orderNo: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = "fiyatcim_orders";

// ==========================================
// HELPERS
// ==========================================

function generateOrderNo(customerName?: { ad: string; soyad: string }): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;

  // Kişiye özel: ad-soyad baş harfleri
  const initials = customerName
    ? (customerName.ad.charAt(0) + customerName.soyad.charAt(0)).toUpperCase()
    : "XX";

  // Format: FC-SA-260303-4872
  return `FC-${initials}-${yy}${mm}${dd}-${rand}`;
}

function generateId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ==========================================
// PROVIDER
// ==========================================

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // localStorage'dan yükle — safeGetJSON ile (GATE 3)
  useEffect(() => {
    const data = safeGetJSON<Order[]>(ORDERS_STORAGE_KEY, []);
    const validOrders = Array.isArray(data)
      ? data.filter((o): o is Order => typeof o === "object" && o !== null && "id" in o && "order_no" in o)
      : [];
    setOrders(validOrders);
    setIsLoaded(true);
  }, []);

  // localStorage'a kaydet — safeSetJSON ile (GATE 3)
  useEffect(() => {
    if (!isLoaded) return;
    safeSetJSON(ORDERS_STORAGE_KEY, orders);
  }, [orders, isLoaded]);

  // Sipariş oluştur
  const createOrder = useCallback((params: CreateOrderParams): Order => {
    const now = new Date().toISOString();
    const orderId = generateId();

    // OrderItem snapshot'ları oluştur
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

    // İlk status log
    const initialLog: OrderStatusLog = {
      id: `log-${Date.now()}`,
      order_id: orderId,
      old_status: null,
      new_status: "paid",
      changed_by: params.user?.email || "misafir",
      created_at: now,
    };

    // SECURITY: Sprint 3'te server-side price validation zorunlu.
    // Sprint 2'de total client'tan geliyor — manipüle edilebilir (demo kabul).
    const order: Order = {
      id: orderId,
      order_no: generateOrderNo(params.customerName),
      user_id: params.user?.id || "",
      status: "paid", // Demo: anında paid
      payment_status: "success",
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
      created_at: now,
      items: orderItems,
      status_logs: [initialLog],
    };

    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

  // Sipariş durumu güncelle
  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
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

  return (
    <OrderContext.Provider
      value={{ orders, createOrder, updateOrderStatus, getOrdersByUser, getAllOrders, getOrderByNo }}
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
