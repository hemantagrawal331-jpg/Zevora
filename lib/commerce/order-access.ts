import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function newOrderAccessToken() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashAccessToken(token) };
}

export function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function accessTokenMatches(storedHash: string | null, token: string | null) {
  if (!storedHash || !token || !/^[a-f0-9]{64}$/i.test(storedHash)) return false;
  const given = hashAccessToken(token);
  if (given.length !== storedHash.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(storedHash));
}
