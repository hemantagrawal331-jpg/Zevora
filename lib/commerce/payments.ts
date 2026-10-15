export type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";

const statuses: PaymentStatus[] = ["authorized", "captured", "failed", "refunded"];

async function hmac(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signPaymentBody(secret: string, body: string) {
  return hmac(secret, body);
}

export async function paymentSignaturesMatch(secret: string, body: string, header: string | null) {
  if (!secret || !header) return false;
  const expected = await hmac(secret, body);
  const given = header.trim().toLowerCase();
  if (expected.length !== given.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) diff |= expected.charCodeAt(index) ^ given.charCodeAt(index);
  return diff === 0;
}

export function parsePaymentEvent(body: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false as const, message: "Payment event is not valid JSON." };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false as const, message: "Payment event is incomplete." };
  const event = parsed as Record<string, unknown>;
  const provider = typeof event.provider === "string" ? event.provider.trim() : "";
  const eventId = typeof event.eventId === "string" ? event.eventId.trim() : "";
  const orderId = typeof event.orderId === "string" ? event.orderId.trim() : "";
  const status = typeof event.status === "string" ? event.status.trim() : "";
  const amount = event.amountInPaise;
  if (!/^[a-z0-9_-]{2,40}$/i.test(provider) || provider === "unconfigured") {
    return { ok: false as const, message: "Payment provider is not accepted." };
  }
  if (!/^[A-Za-z0-9:_-]{6,120}$/.test(eventId)) return { ok: false as const, message: "Payment event id is invalid." };
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { ok: false as const, message: "Order id is invalid." };
  if (!statuses.includes(status as PaymentStatus)) return { ok: false as const, message: "Payment status is invalid." };
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    return { ok: false as const, message: "Payment amount must be a positive number of paise." };
  }
  return {
    ok: true as const,
    event: { provider, eventId, orderId, status: status as PaymentStatus, amountInPaise: amount },
  };
}
