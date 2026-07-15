/**
 * Centralized, validated environment configuration.
 * All env access goes through this module so missing vars fail fast at boot
 * instead of silently producing null clients mid-request.
 */
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ALLOWED_ORIGINS: z.string().default(""),
  AI_ENCRYPTION_KEY: z.string().optional(),
  SETUP_TOKEN: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    // Don't throw during build — some routes are statically analyzed.
    if (process.env.NODE_ENV === "production") {
      // In production, missing env vars cause silent failures. Throw to fail fast.
      throw new Error(`[env] Missing/invalid environment variables: ${issues}`);
    }
    console.warn(`[env] Missing/invalid environment variables: ${issues}`);
    return process.env as unknown as Env;
  }
  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = !isProduction;

/** Parsed list of allowed CORS origins. */
export const allowedOrigins = (env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const VERSION = "1.0.0";
