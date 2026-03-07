"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { ActivityLogEntry, ActivityLogType } from "@/types/admin";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

const STORAGE_KEY = "fiyatcim_activity_log";
const MAX_ENTRIES = 200;

interface ActivityLogContextType {
  logs: ActivityLogEntry[];
  addLog: (type: ActivityLogType, message: string, entityType?: string, entityId?: string, meta?: Record<string, unknown>) => void;
  clearLogs: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = safeGetJSON<ActivityLogEntry[]>(STORAGE_KEY, []);
    if (Array.isArray(stored)) setLogs(stored);
    setIsLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!isLoaded) return;
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
