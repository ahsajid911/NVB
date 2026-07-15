import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash-backed rate limiter for Vercel serverless.
 *
 * Falls back to in-memory Map when UPSTASH_REDIS_REST_URL is not set (local dev).
 * Requires env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */

// --- Upstash client (created once) ---
let redis: Redis | null = null;
let upstashAvailable = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  upstashAvailable = true;
}

// --- Upstash limiter cache (one per action+window combo) ---
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(action: string, limit: number, windowMs: number): Ratelimit {
  const key = `${action}:${limit}:${windowMs}`;
  if (!upstashLimiters.has(key)) {
    upstashLimiters.set(
      key,
      new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        analytics: false,
      })
    );
  }
  return upstashLimiters.get(key)!;
}

// --- In-memory fallback (for local dev without Upstash) ---
interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();
const SWEEP_INTERVAL = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

function inMemoryRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  return inMemoryRateLimit(key, opts.limit, opts.windowMs);
}

/** Extract a best-effort client IP from a Next request. */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    // Vercel appends the real client IP at the end of the chain.
    // Use the last value to prevent IP spoofing via x-forwarded-for header.
    const parts = xff.split(",").map((p) => p.trim());
    return parts[parts.length - 1] || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Check rate limit and return a 429 response if exceeded.
 * Uses Upstash Redis when available, falls back to in-memory.
 */
export async function enforceRateLimit(
  request: NextRequest,
  action: string,
  opts: RateLimitOptions
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const key = `${action}:${ip}`;

  if (upstashAvailable) {
    const limiter = getUpstashLimiter(action, opts.limit, opts.windowMs);
    const result = await limiter.limit(key);

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfter)) } }
      );
    }
    return null;
  }

  // In-memory fallback
  const result = inMemoryRateLimit(key, opts.limit, opts.windowMs);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
  );
}
