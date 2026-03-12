"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { ActivityLogEntry, ActivityLogType } from "@/types/admin";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { createClient } from "@/lib/supabase/client";

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

    // Non-demo: load from audit_logs
    let isMounted = true;
    const supabase = createClient();
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX_ENTRIES)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("[ActivityLog] load failed:", error.message);
          setLogs([]);
        } else {
          setLogs((data ?? []).map((row) => ({
            id: row.id,
            type: (row.action as ActivityLogType) || "info",
            message: row.action || "",
            entityType: row.entity_type,
            entityId: row.entity_id,
            createdAt: row.created_at,
            meta: row.new_value as Record<string, unknown> | undefined,
          })));
        }
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
        const supabase = createClient();
        supabase.from("audit_logs").insert({
          action: message,
          entity_type: entityType,
          entity_id: entityId,
          new_value: meta,
        }).then(({ error }) => {
          if (error) console.error("[ActivityLog] insert failed:", error.message);
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
