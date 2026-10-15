import { scrypt as scryptCallback, timingSafeEqual, createHash, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SALT_BYTES = 16;
const HASH_BYTES = 32;

export function isPasswordHash(value: string) {
  return /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/i.test(value);
}

export async function hashPassword(password: string) {
  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }
  const salt = randomBytes(SALT_BYTES);
  const hash = (await scrypt(password, salt, HASH_BYTES)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  if (!isPasswordHash(stored)) return false;
  const [, saltHex, hashHex] = stored.split("$");
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(password, salt, HASH_BYTES)) as Buffer;
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function emailsMatch(provided: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest();
  return timingSafeEqual(digest(provided), digest(expected));
}
