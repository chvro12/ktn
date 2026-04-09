import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

/** Jeton opaque pour cookie ; stocké en DB sous forme hachée (SHA-256 hex). */
export function createSessionSecretToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
