import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * NOTE: state lives per server instance. On serverless platforms (Vercel) each
 * instance has its own counter, so the effective limit is per-instance. This is
 * still effective against brute-force / abuse from a single source for typical
 * workloads, and adds zero infrastructure dependencies. For stricter limits,
 * back this with Redis/Upstash.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically evict expired entries so the map cannot grow unbounded.
const SWEEP_INTERVAL = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in ms. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // seconds
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  const allowed = bucket.count <= opts.limit;
  return {
    allowed,
    remaining: Math.max(0, opts.limit - bucket.count),
    retryAfter: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Extract a best-effort client IP from a Next request. */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Convenience: check the rate limit and return a 429 response if exceeded.
 * Otherwise returns null and the caller continues.
 *
 * Usage:
 *   const limited = enforceRateLimit(request, "login", { limit: 10, windowMs: 60_000 });
 *   if (limited) return limited;
 */
export function enforceRateLimit(
  request: NextRequest,
  action: string,
  opts: RateLimitOptions
): NextResponse | null {
  const ip = getClientIp(request);
  const result = rateLimit(`${action}:${ip}`, opts);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    }
  );
}
