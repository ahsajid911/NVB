import crypto from "crypto";

/**
 * AES-256-GCM encryption for secrets stored at rest (e.g. AI provider API keys).
 *
 * Requires AI_ENCRYPTION_KEY: a 64-char hex string (32 bytes). Generate with:
 *   node -e "console.log(crypto.randomBytes(32).toString('hex'))"
 *
 * Encrypted values are stored as "v1:<ivHex>:<authTagHex>:<cipherHex>".
 * decrypt() gracefully falls back to treating the value as plaintext if it is
 * not in the encrypted format OR the key is not configured / mismatches, so
 * existing plaintext rows keep working during migration.
 */

const VERSION = "v1";
const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer | null {
  const raw = process.env.AI_ENCRYPTION_KEY;
  if (!raw) return null;
  // Accept either a 64-char hex string or a 32-byte utf-8 passphrase.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  if (raw.length === 32) return Buffer.from(raw, "utf8");
  // Otherwise derive a 32-byte key via sha256 so any passphrase works.
  return crypto.createHash("sha256").update(raw).digest();
}

export function encrypt(plain: string): string {
  const key = getKey();
  // If no key is configured, store as-is (legacy behaviour). This keeps the app
  // running, but operators should set AI_ENCRYPTION_KEY to get protection.
  if (!key) return plain;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("hex"), tag.toString("hex"), enc.toString("hex")].join(":");
}

export function decrypt(value: string): string {
  if (!value.startsWith(VERSION + ":")) return value; // not encrypted -> plaintext passthrough
  const key = getKey();
  if (!key) return value; // cannot decrypt without key -> leave as-is rather than throwing
  const parts = value.split(":");
  if (parts.length !== 4) return value; // malformed -> passthrough
  const [, ivHex, tagHex, encHex] = parts;
  try {
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const dec = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    // Key mismatch / tampering - treat as plaintext so existing keys still work.
    return value;
  }
}

/** True when encryption is actively protecting values (key configured). */
export function isEncryptionEnabled(): boolean {
  return getKey() !== null;
}
