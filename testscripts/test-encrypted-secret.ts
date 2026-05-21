/**
 * Round-trip + tamper-detection tests for the BYOK encryption helper.
 * Run from the template repo root: npx tsx testscripts/test-encrypted-secret.ts
 */
import { decryptSecret, encryptSecret } from "../src/lib/server/secrets/encrypted-secret";

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

function main(): void {
  process.env.SECRETS_ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  // Case 1 — round-trip
  const plaintext = "sk-test-1234567890ABCDEF";
  const ct = encryptSecret(plaintext);
  assert(ct !== plaintext, "ciphertext must differ from plaintext");
  assert(typeof ct === "string" && ct.length > 0, "ciphertext must be non-empty string");
  const back = decryptSecret(ct);
  assert(back === plaintext, `round-trip failed: got ${back}`);

  // Case 2 — different ciphertexts each call (random IV)
  const ct2 = encryptSecret(plaintext);
  assert(ct2 !== ct, "two encryptions of same plaintext must yield different ciphertexts (random IV)");
  assert(decryptSecret(ct2) === plaintext, "second ciphertext must decrypt to same plaintext");

  // Case 3 — tampered ciphertext throws
  const tampered = ct.slice(0, -4) + "AAAA";
  let threw = false;
  try { decryptSecret(tampered); } catch { threw = true; }
  assert(threw, "tampered ciphertext must throw");

  // Case 4 — empty input rejected
  let emptyThrew = false;
  try { decryptSecret(""); } catch { emptyThrew = true; }
  assert(emptyThrew, "empty ciphertext must throw");

  let plainThrew = false;
  try { (encryptSecret as unknown as (s: unknown) => string)(123); } catch { plainThrew = true; }
  assert(plainThrew, "non-string plaintext must throw");

  console.log("encrypted-secret OK");
}

main();
