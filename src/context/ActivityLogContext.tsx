"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { ActivityLogEntry, ActivityLogType } from "@/types/admin";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { logger } from "@/lib/logger";

const STORAGE_KEY = "fiyatcim_activity_log";
const MAX_ENTRIES = 200;
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface ActivityLogContextType {
  logs: ActivityLogEntry[];
  addLog: (type: ActivityLogType, message: string, entityType?: string, entityId?: string, meta?: Record<string, unknown>) => void;
  clearLogs: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load
  useEffect(() => {
    if (IS_DEMO) {
      const stored = safeGetJSON<ActivityLogEntry[]>(STORAGE_KEY, []);
      if (Array.isArray(stored)) setLogs(stored);
      setIsLoaded(true);
      return;
    }

    // GÜVENLIK: audit_logs artık server-side admin route üzerinden okunur.
    // Client-side doğrudan Supabase erişimi kaldırıldı.
    // @see claude2-detailed-security-report-2026-03-23.md — Bulgu #3
    let isMounted = true;
    fetch("/api/admin/audit-logs?limit=200")
      .then((res) => {
        if (!res.ok) {
          // Admin değilse veya auth yoksa sessizce boş dön
          return { data: [] };
        }
        return res.json();
      })
      .then((result) => {
        if (!isMounted) return;
        const rows = result.data ?? [];
        setLogs(rows.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          type: (row.action as ActivityLogType) || "info",
          message: (row.action as string) || "",
          entityType: row.entity_type as string | undefined,
          entityId: row.entity_id as string | undefined,
          createdAt: row.created_at as string,
          meta: row.new_value as Record<string, unknown> | undefined,
        })));
        setIsLoaded(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        logger.error("activity_log_load_failed", { fn: "ActivityLogProvider", error: err instanceof Error ? err.message : String(err) });
        setLogs([]);
        setIsLoaded(true);
      });

    return () => { isMounted = false; };
  }, []);

  // Persist demo
  useEffect(() => {
    if (!IS_DEMO || !isLoaded) return;
    safeSetJSON(STORAGE_KEY, logs);
  }, [logs, isLoaded]);

  const addLog = useCallback(
    (type: ActivityLogType, message: string, entityType?: string, entityId?: string, meta?: Record<string, unknown>) => {
      const entry: ActivityLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        message,
        entityType,
        entityId,
        createdAt: new Date().toISOString(),
        meta,
      };
      setLogs((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));

      if (!IS_DEMO) {
        // GÜVENLIK: audit_logs yazma da server-side admin route üzerinden yapılır
        fetch("/api/admin/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: message,
            entity_type: entityType,
            entity_id: entityId,
            new_value: meta,
          }),
        }).catch((err) => {
          logger.error("activity_log_insert_failed", { fn: "addLog", error: err instanceof Error ? err.message : String(err) });
        });
      }
    },
    []
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <ActivityLogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog() {
  const context = useContext(ActivityLogContext);
  if (!context) {
    throw new Error("useActivityLog must be used within an ActivityLogProvider");
  }
  return context;
}
