"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { ReturnRequest, ReturnStatus, ReturnReason, ReturnRequestItem } from "@/types";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "fiyatcim_returns";
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ==========================================
// STATUS TRANSITION RULES
// ==========================================

const ALLOWED_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["completed"],
  rejected: [],
  completed: [],
};

// ==========================================
// CONTEXT INTERFACE
// ==========================================

interface ReturnContextType {
  returns: ReturnRequest[];
  createReturn: (params: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerId?: string;
    items: ReturnRequestItem[];
    reason: ReturnReason;
    description?: string;
    refundAmount?: number;
  }) => ReturnRequest;
  updateReturnStatus: (
    id: string,
    newStatus: ReturnStatus,
    extra?: { rejectionReason?: string; notes?: string }
  ) => boolean;
  getReturnsByOrder: (orderId: string) => ReturnRequest[];
  getReturnById: (id: string) => ReturnRequest | undefined;
  seedDemoReturns: () => void;
}

const ReturnContext = createContext<ReturnContextType | undefined>(undefined);

// ==========================================
// PROVIDER
// ==========================================

export function ReturnProvider({ children }: { children: ReactNode }) {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load
  useEffect(() => {
    if (IS_DEMO) {
      const stored = safeGetJSON<ReturnRequest[]>(STORAGE_KEY, []);
      if (Array.isArray(stored)) setReturns(stored);
      setIsLoaded(true);
      return;
    }

    // Non-demo: Supabase
    let isMounted = true;
    const loadFromSupabase = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (!user) {
          setReturns([]);
          setIsLoaded(true);
          return;
        }

        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
        if (!isMounted) return;
        const isAdmin = profile?.role === "admin";
        let query = supabase.from("returns").select("*").order("requested_at", { ascending: false });
        if (!isAdmin) {
          query = query.eq("user_id", user.id);
        }
        const { data, error } = await query;
        if (!isMounted) return;
        if (error) {
          console.error("[ReturnContext] load failed:", error.message);
          setReturns([]);
        } else {
          setReturns((data ?? []).map((row) => ({
            id: row.id,
            returnNumber: row.return_number,
            orderId: row.order_id,
            orderNumber: "",
            customerId: row.user_id,
            customerName: row.customer_name || "",
            items: Array.isArray(row.items) ? row.items as ReturnRequestItem[] : [],
            reason: row.reason as ReturnReason,
            description: row.description,
            status: row.status as ReturnStatus,
            requestedAt: row.requested_at,
            updatedAt: row.updated_at,
            refundAmount: row.refund_amount ? Number(row.refund_amount) : undefined,
            rejectionReason: row.rejection_reason,
            notes: row.notes,
          })));
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("[ReturnContext] unexpected error:", err);
        setReturns([]);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };
    loadFromSupabase();

    return () => { isMounted = false; };
  }, []);

  // Persist demo
  useEffect(() => {
    if (!IS_DEMO || !isLoaded) return;
    safeSetJSON(STORAGE_KEY, returns);
  }, [returns, isLoaded]);

  // ---- CREATE ----
  const createReturn = useCallback(
    (params: {
      orderId: string;
      orderNumber: string;
      customerName: string;
      customerId?: string;
      items: ReturnRequestItem[];
      reason: ReturnReason;
      description?: string;
      refundAmount?: number;
    }): ReturnRequest => {
      const now = new Date().toISOString();
      const entry: ReturnRequest = {
        id: `ret-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        returnNumber: `IA-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        customerName: params.customerName,
        customerId: params.customerId,
        items: params.items,
        reason: params.reason,
        description: params.description,
        status: "pending",
        requestedAt: now,
        updatedAt: now,
        refundAmount: params.refundAmount,
      };
      setReturns((prev) => [entry, ...prev]);

      if (!IS_DEMO) {
        const supabase = createClient();
        supabase.from("returns").insert({
          return_number: entry.returnNumber,
          order_id: params.orderId,
          user_id: params.customerId,
          customer_name: params.customerName,
          reason: params.reason,
          description: params.description,
          refund_amount: params.refundAmount,
          items: params.items,
        }).select("id").single().then(({ data: inserted, error }) => {
          if (error) {
            console.error("[ReturnContext] insert failed:", error.message);
          } else if (inserted) {
            setReturns((prev) =>
              prev.map((r) => (r.id === entry.id ? { ...r, id: inserted.id } : r))
            );
          }
        });
      }

      return entry;
    },
    []
  );

  // ---- UPDATE STATUS ----
  const updateReturnStatus = useCallback(
    (id: string, newStatus: ReturnStatus, extra?: { rejectionReason?: string; notes?: string }): boolean => {
      let success = false;
      setReturns((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          if (!ALLOWED_TRANSITIONS[r.status].includes(newStatus)) return r;
          success = true;
          const now = new Date().toISOString();
          return {
            ...r,
            status: newStatus,
            updatedAt: now,
            ...(newStatus === "approved" ? { approvedAt: now } : {}),
            ...(newStatus === "rejected" ? { rejectedAt: now, rejectionReason: extra?.rejectionReason } : {}),
            ...(newStatus === "completed" ? { completedAt: now } : {}),
            ...(extra?.notes ? { notes: extra.notes } : {}),
          };
        })
      );

      if (success && !IS_DEMO) {
        const supabase = createClient();
        const updateData: Record<string, unknown> = { status: newStatus };
        if (extra?.rejectionReason) updateData.rejection_reason = extra.rejectionReason;
        if (extra?.notes) updateData.notes = extra.notes;
        supabase.from("returns").update(updateData).eq("id", id)
          .then(({ error }) => {
            if (error) console.error("[ReturnContext] update failed:", error.message);
          });
      }

      return success;
    },
    []
  );

  // ---- QUERIES ----
  const getReturnsByOrder = useCallback(
    (orderId: string) => returns.filter((r) => r.orderId === orderId),
    [returns]
  );

  const getReturnById = useCallback(
    (id: string) => returns.find((r) => r.id === id),
    [returns]
  );

  // ---- SEED DEMO DATA ----
  const seedDemoReturns = useCallback(() => {
    if (returns.length > 0) return;

    const now = Date.now();
    const demo: ReturnRequest[] = [
      {
        id: "ret-demo-1",
        returnNumber: "IA-DEMO01",
        orderId: "demo-order-1",
        orderNumber: "FYT-100001",
        customerName: "Ahmet Yılmaz",
        items: [{ productId: "p1", productName: "Ajax MotionProtect Hareket Sensörü", qty: 1, price: 850 }],
        reason: "defective",
        description: "Sensör sürekli yanlış alarm veriyor.",
        status: "pending",
        requestedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        refundAmount: 850,
      },
      {
        id: "ret-demo-2",
        returnNumber: "IA-DEMO02",
        orderId: "demo-order-2",
        orderNumber: "FYT-100002",
        customerName: "Elif Kara",
        items: [
          { productId: "p2", productName: "Hikvision DS-2CD2143G2 IP Kamera", qty: 2, price: 2400 },
          { productId: "p3", productName: "Hikvision NVR 8 Kanal", qty: 1, price: 3200 },
        ],
        reason: "wrong_item",
        description: "4 kanal yerine 8 kanal NVR geldi.",
        status: "approved",
        requestedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        refundAmount: 8000,
      },
      {
        id: "ret-demo-3",
        returnNumber: "IA-DEMO03",
        orderId: "demo-order-3",
        orderNumber: "FYT-100003",
        customerName: "Mehmet Demir",
        items: [{ productId: "p4", productName: "Ajax StarterKit Alarm Seti", qty: 1, price: 6500 }],
        reason: "changed_mind",
        status: "rejected",
        requestedAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        rejectedAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        rejectionReason: "14 günlük iade süresi dolmuş.",
        refundAmount: 6500,
      },
      {
        id: "ret-demo-4",
        returnNumber: "IA-DEMO04",
        orderId: "demo-order-4",
        orderNumber: "FYT-100004",
        customerName: "Zeynep Çelik",
        items: [{ productId: "p5", productName: "Dahua 4 Kameralı Set", qty: 1, price: 4200 }],
        reason: "damaged",
        description: "Kargo sırasında kutu ezilmiş, kamera lensi çizik.",
        status: "completed",
        requestedAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        refundAmount: 4200,
        notes: "Yeni ürün kargoya verildi.",
      },
    ];
    setReturns(demo);
  }, [returns.length]);

  return (
    <ReturnContext.Provider
      value={{ returns, createReturn, updateReturnStatus, getReturnsByOrder, getReturnById, seedDemoReturns }}
    >
      {children}
    </ReturnContext.Provider>
  );
}

// ==========================================
// HOOK
// ==========================================

export function useReturns() {
  const context = useContext(ReturnContext);
  if (!context) {
    throw new Error("useReturns must be used within a ReturnProvider");
  }
  return context;
}
