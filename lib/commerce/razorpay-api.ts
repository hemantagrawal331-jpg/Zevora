import "server-only";

import { razorpayOrderBody, readRazorpayPayment, type RazorpayPayment } from "@/lib/commerce/razorpay";
import { gatewayReady } from "@/lib/commerce/checkout-input";

export type RazorpaySettings = {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  testMode: boolean;
};

export function razorpaySettings(): RazorpaySettings | null {
  const serverKey = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
  if (serverKey && publicKey && serverKey !== publicKey) return null;
  const keyId = serverKey || publicKey;
  if (!gatewayReady(keyId, keySecret)) return null;
  return { keyId, keySecret, webhookSecret, testMode: keyId.startsWith("rzp_test_") };
}

function authorization(settings: RazorpaySettings) {
  return `Basic ${Buffer.from(`${settings.keyId}:${settings.keySecret}`).toString("base64")}`;
}

async function razorpayFetch(settings: RazorpaySettings, path: string, init?: { method?: string; body?: unknown }) {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: authorization(settings),
      "Content-Type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!response.ok) return { ok: false as const, message: "Razorpay did not accept the request." };
  return { ok: true as const, data: parsed };
}

export async function createRazorpayOrder(settings: RazorpaySettings, amountInPaise: number, receipt: string) {
  const body = razorpayOrderBody(amountInPaise, receipt);
  if (!body.ok) return body;
  const result = await razorpayFetch(settings, "orders", { method: "POST", body: body.body });
  if (!result.ok) return result;
  const order = result.data as { id?: string; amount?: number; currency?: string; status?: string } | null;
  if (!order?.id || !/^order_[A-Za-z0-9]+$/.test(order.id) || order.amount !== amountInPaise || order.currency !== "INR") {
    return { ok: false as const, message: "Razorpay returned an order that does not match this checkout." };
  }
  return { ok: true as const, orderId: order.id, amount: order.amount, currency: "INR" as const, status: order.status ?? "created" };
}

export async function fetchRazorpayPayment(settings: RazorpaySettings, paymentId: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) return { ok: false as const, message: "The payment reference is not valid." };
  const result = await razorpayFetch(settings, `payments/${paymentId}`);
  if (!result.ok) return result;
  const payment = readRazorpayPayment(result.data);
  if (!payment) return { ok: false as const, message: "Razorpay did not return a payment that can be checked." };
  return { ok: true as const, payment };
}

export async function fetchRazorpayOrderPayments(settings: RazorpaySettings, orderId: string) {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) return { ok: false as const, message: "The Razorpay order is not valid." };
  const result = await razorpayFetch(settings, `orders/${orderId}/payments`);
  if (!result.ok) return result;
  const items = (result.data as { items?: unknown[] } | null)?.items ?? [];
  const payments = items.flatMap((item) => {
    const payment = readRazorpayPayment(item);
    return payment ? [payment] : [];
  });
  return { ok: true as const, payments };
}

export async function refundRazorpayPayment(settings: RazorpaySettings, payment: RazorpayPayment) {
  const result = await razorpayFetch(settings, `payments/${payment.id}/refund`, {
    method: "POST",
    body: { amount: payment.amount },
  });
  if (!result.ok) return result;
  return { ok: true as const };
}
