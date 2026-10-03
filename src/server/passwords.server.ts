import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with scrypt from node:crypto (no third-party auth service).
 * Plaintext passwords are never stored, never logged and never returned anywhere.
 *
 * Stored form: `scrypt$<saltHex>$<hashHex>` (scrypt N=16384, r=8, p=1, 64-byte key).
 */

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

const scrypt = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scryptCb(password, salt, KEY_LENGTH, (error, derived) => {
      if (error) reject(error instanceof Error ? error : new Error("hash failed"));
      else resolve(derived);
    });
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(password, salt);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length !== KEY_LENGTH) return false;
  const derived = await scrypt(password, salt);
  return timingSafeEqual(derived, expected);
}

/** 32 random bytes, URL-safe: only ever sent to the browser, never logged. */
export const newToken = (): string => randomBytes(32).toString("base64url");

/**
 * A stored-form hash of a throwaway password, built once per process.
 *
 * Used only when a sign-in attempt names an email with no account: verifying
 * against this costs exactly what verifying a real password costs, so the answer
 * cannot be told apart by how long it took.
 */
let dummyHash: Promise<string> | null = null;

const dummyStoredHash = (): Promise<string> => {
  dummyHash ??= hashPassword(newToken());
  return dummyHash;
};

/** Always false. Spends one hash-cost verification so an unknown email and a
 * wrong password take the same time. */
export const verifyPasswordWhenUnknown = async (password: string): Promise<false> => {
  await verifyPassword(password, await dummyStoredHash());
  return false;
};
