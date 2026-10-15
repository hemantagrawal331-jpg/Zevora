import { createHmac, timingSafeEqual } from "node:crypto";

export const RAZORPAY_MAX_PAISE = 50_000_000;
export const RAZORPAY_MIN_PAISE = 100;

export type RazorpayCheckoutPayload = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: "INR";
  reference: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

export type RazorpayDecision =
  | { action: "confirm" }
  | { action: "record_failed" }
  | { action: "record_authorized" }
  | { action: "refund" }
  | { action: "ignore"; reason: string };

const settled = new Set(["confirmed", "processing", "shipped", "delivered", "return_requested", "returned", "refunded"]);

export function checkoutSignature(keySecret: string, orderId: string, paymentId: string) {
  return createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function webhookSignature(webhookSecret: string, rawBody: string) {
  return createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
}

export function signaturesMatch(expected: string, received: string | null) {
  if (!expected || !received) return false;
  const given = received.trim().toLowerCase();
  const wanted = expected.trim().toLowerCase();
  if (given.length !== wanted.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(wanted));
}

export function razorpayOrderBody(amountInPaise: number, receipt: string) {
  if (!Number.isInteger(amountInPaise) || amountInPaise < RAZORPAY_MIN_PAISE || amountInPaise > RAZORPAY_MAX_PAISE) {
    return { ok: false as const, message: "This order amount cannot be charged." };
  }
  const safeReceipt = receipt.trim().slice(0, 40);
  if (!safeReceipt) return { ok: false as const, message: "This order could not be identified." };
  return {
    ok: true as const,
    body: {
      amount: amountInPaise,
      currency: "INR" as const,
      receipt: safeReceipt,
      payment_capture: true,
      notes: { reference: safeReceipt },
    },
  };
}

export function parseCheckoutCallback(value: unknown) {
  if (!value || typeof value !== "object") return { ok: false as const, message: "The payment response could not be read." };
  const row = value as Record<string, unknown>;
  const paymentId = typeof row.razorpay_payment_id === "string" ? row.razorpay_payment_id.trim() : "";
  const orderId = typeof row.razorpay_order_id === "string" ? row.razorpay_order_id.trim() : "";
  const signature = typeof row.razorpay_signature === "string" ? row.razorpay_signature.trim() : "";
  const reference = typeof row.reference === "string" ? row.reference.trim().toUpperCase() : "";
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) return { ok: false as const, message: "The payment reference is not valid." };
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) return { ok: false as const, message: "The Razorpay order is not valid." };
  if (!/^[a-f0-9]{64}$/i.test(signature)) return { ok: false as const, message: "The payment signature is not valid." };
  if (!/^ZV[A-Z0-9]{8}$/.test(reference)) return { ok: false as const, message: "The order reference is not valid." };
  return { ok: true as const, paymentId, orderId, signature, reference };
}

export type RazorpayPayment = {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
};

export function readRazorpayPayment(value: unknown): RazorpayPayment | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const orderId = typeof row.order_id === "string" ? row.order_id : "";
  const currency = typeof row.currency === "string" ? row.currency : "";
  const status = typeof row.status === "string" ? row.status : "";
  const amount = row.amount;
  if (!/^pay_[A-Za-z0-9]+$/.test(id) || !/^order_[A-Za-z0-9]+$/.test(orderId)) return null;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) return null;
  return { id, orderId, amount, currency, status };
}

export function parseRazorpayWebhook(rawBody: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { ok: false as const, message: "The webhook body is not valid JSON." };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false as const, message: "The webhook body is incomplete." };
  const event = parsed as Record<string, unknown>;
  const name = typeof event.event === "string" ? event.event : "";
  const payload = event.payload;
  const paymentEntity =
    payload && typeof payload === "object"
      ? ((payload as { payment?: { entity?: unknown } }).payment?.entity ?? null)
      : null;
  const payment = readRazorpayPayment(paymentEntity);
  return { ok: true as const, name, payment };
}

export function decideRazorpayUpdate(input: {
  event: string;
  payment: RazorpayPayment | null;
  orderAmount: number;
  orderStatus: string;
  storedOrderId: string | null;
  duplicate: boolean;
}): RazorpayDecision {
  if (input.duplicate) return { action: "ignore", reason: "duplicate" };
  const payment = input.payment;
  if (!payment || !["payment.captured", "payment.failed", "payment.authorized", "order.paid", "checkout.verified"].includes(input.event)) {
    return { action: "ignore", reason: "missing-payment" };
  }
  if (input.storedOrderId && payment.orderId !== input.storedOrderId) return { action: "ignore", reason: "order-mismatch" };
  if (payment.currency !== "INR" || payment.amount !== input.orderAmount) return { action: "ignore", reason: "amount-mismatch" };
  const captured = payment.status === "captured";
  const failed = payment.status === "failed";
  const authorized = payment.status === "authorized";
  if ((captured || authorized) && (input.orderStatus === "cancelled" || input.orderStatus === "payment_failed" || settled.has(input.orderStatus))) {
    return { action: "refund" };
  }
  if (captured && input.orderStatus === "pending_payment") return { action: "confirm" };
  if (failed && input.orderStatus === "pending_payment") return { action: "record_failed" };
  if (authorized && input.orderStatus === "pending_payment") return { action: "record_authorized" };
  return { action: "ignore", reason: "unverified" };
}

export function paymentEventId(status: "captured" | "failed" | "authorized" | "refunded", paymentId: string) {
  return `${status}:${paymentId}`;
}
