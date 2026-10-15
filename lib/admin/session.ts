export const ADMIN_COOKIE = "zevora_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionClaims = {
  sub: string;
  role: string;
  exp: number;
};

export function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  if (secret.length < 32) return null;
  return secret;
}

export function adminCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function timingSafeEqualString(left: string, right: string) {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a[index] ^ b[index];
  return diff === 0;
}

async function hmac(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function signSession(payload: SessionClaims) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Admin session is not configured.");
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmac(encoded, secret);
  return `${encoded}.${signature}`;
}

export function createSessionToken(email: string, now = Date.now()) {
  return signSession({
    sub: email.trim().toLowerCase(),
    role: "admin",
    exp: now + SESSION_TTL_SECONDS * 1000,
  });
}

export async function readSessionToken(token: string | undefined | null, now = Date.now()) {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;
  const expected = await hmac(encoded, secret);
  if (!timingSafeEqualString(expected, signature)) return null;

  try {
    const padded = encoded.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Partial<SessionClaims>;
    if (payload.role !== "admin" || typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    if (!Number.isFinite(payload.exp) || payload.exp <= now) return null;
    return { sub: payload.sub, role: "admin" as const, exp: payload.exp };
  } catch {
    return null;
  }
}

export function safeNext(value: string | undefined | null) {
  const fallback = "/admin/sourcing";
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) return fallback;
  const withoutHash = decoded.split("#")[0] ?? "";
  const path = withoutHash.split("?")[0] ?? "";
  if (path.includes("..") || path.includes("://")) return fallback;
  if (path !== "/admin/sourcing" && !path.startsWith("/admin/sourcing/")) return fallback;
  return value;
}
