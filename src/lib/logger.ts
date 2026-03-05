// ==========================================
// Structured Logger — Production-Grade
// ==========================================

type LogLevel = "info" | "warn" | "error";

interface LogMeta {
  fn: string;
  demo?: boolean;
  rows?: number;
  total?: number;
  ms?: number;
  error?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, event: string, meta: LogMeta): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...meta,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (event: string, meta: LogMeta) => log("info", event, meta),
  warn: (event: string, meta: LogMeta) => log("warn", event, meta),
  error: (event: string, meta: LogMeta) => log("error", event, meta),
};
