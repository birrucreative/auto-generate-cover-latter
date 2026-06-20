/**
 * Authenticated symmetric encryption for the OAuth token cookie.
 * AES-256-GCM with a key derived from AUTH_SECRET. Server-only.
 */

import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

function keyFromSecret(secret: string): Buffer {
  // 32-byte key from the configured secret (any length input).
  return createHash("sha256").update(secret).digest();
}

/** Encrypt a UTF-8 string → base64url token "iv.tag.ciphertext". */
export function encrypt(plain: string, secret: string): string {
  const key = keyFromSecret(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64url")).join(".");
}

/** Decrypt a token produced by encrypt(). Returns null if tampered/invalid. */
export function decrypt(token: string, secret: string): string | null {
  try {
    const [ivB64, tagB64, dataB64] = token.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const key = keyFromSecret(secret);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivB64, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

/** Random URL-safe string for OAuth `state` / CSRF protection. */
export function randomState(): string {
  return randomBytes(16).toString("base64url");
}
