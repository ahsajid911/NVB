/**
 * Structured logger. JSON in production, pretty-printed in development.
 * Every log line includes a timestamp, level, and optional requestId/context.
 */
import { isProduction } from "@/lib/config/env";

type LogLevel = "debug" | "info" | "warn" | "error";

function emit(level: LogLevel, message: string, meta?: Record<string, any>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (isProduction) {
    // Single-line JSON for log aggregators (Datadog, Vercel, etc.)
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(JSON.stringify(entry));
  } else {
    // Pretty-print in dev
    const prefix = `[${level.toUpperCase()}]`;
    const metaStr = meta ? " " + JSON.stringify(meta) : "";
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`${prefix} ${message}${metaStr}`);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, any>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, any>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, any>) => emit("error", msg, meta),
};
