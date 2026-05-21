import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

export function createSessionTokenPair(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = sha256Hex(rawToken);
  return { rawToken, tokenHash };
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
