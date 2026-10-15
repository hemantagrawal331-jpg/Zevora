import "server-only";

import {
  checkoutSignature,
  decideRazorpayUpdate,
  parseCheckoutCallback,
  parseRazorpayWebhook,
  paymentEventId,
  signaturesMatch,
  webhookSignature,
  type RazorpayCheckoutPayload,
  type RazorpayPayment,
} from "@/lib/commerce/razorpay";
import {
  createRazorpayOrder,
  fetchRazorpayOrderPayments,
  fetchRazorpayPayment,
  razorpaySettings,
  refundRazorpayPayment,
} from "@/lib/commerce/razorpay-api";
import { createSupabaseService } from "@/lib/supabase/service";

type OrderPaymentRow = {
  id: string;
  reference: string;
  status: string;
  total_in_paise: number;
  razorpay_order_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

function checkoutPayload(order: OrderPaymentRow, orderId: string, keyId: string): RazorpayCheckoutPayload {
  return {
    keyId,
    orderId,
    amount: order.total_in_paise,
    currency: "INR",
    reference: order.reference,
    name: "ZEVORA",
    description: `Order ${order.reference}`,
    prefill: {
      name: order.contact_name ?? "",
      email: order.contact_email ?? "",
      contact: order.contact_phone ?? "",
    },
  };
}

async function loadPayableOrder(reference: string) {
  const service = createSupabaseService();
  if (!service) return { ok: false as const, message: "The server key is not configured. No payment was confirmed." };
  const result = await service
    .from("orders")
    .select("id, reference, status, total_in_paise, razorpay_order_id, contact_name, contact_email, contact_phone")
    .eq("reference", reference)
    .maybeSingle();
  const order = result.data as OrderPaymentRow | null;
  if (!order) return { ok: false as const, message: "This order could not be opened." };
  return { ok: true as const, service, order };
}

async function rememberSignature(service: NonNullable<ReturnType<typeof createSupabaseService>>, eventId: string, signature: string) {
  await service.from("payments").update({ checkout_signature: signature }).eq("provider", "razorpay").eq("provider_event_id", eventId);
}

async function applyPayment(
  service: NonNullable<ReturnType<typeof createSupabaseService>>,
  orderId: string,
  payment: RazorpayPayment,
  status: "captured" | "failed" | "authorized" | "refunded",
  signature?: string,
) {
  const eventId = paymentEventId(status, payment.id);
  const applied = await service.rpc("apply_payment_event", {
    p_provider: "razorpay",
    p_event_id: eventId,
    p_order_id: orderId,
    p_status: status,
    p_amount: payment.amount,
  });
  if (applied.error) {
    const message = applied.error.message || "";
    if (message.includes("does not match")) return { ok: false as const, result: "mismatch" as const };
    return { ok: false as const, result: "error" as const };
  }
  if (signature) await rememberSignature(service, eventId, signature);
  return { ok: true as const, result: String(applied.data ?? "recorded") };
}

export async function applyRazorpayDecision(
  order: OrderPaymentRow,
  payment: RazorpayPayment,
  event: string,
  duplicate: boolean,
  signature?: string,
) {
  const service = createSupabaseService();
  if (!service) return { ok: false as const, message: "The server key is not configured. No payment was confirmed." };
  const decision = decideRazorpayUpdate({
    event,
    payment,
    orderAmount: order.total_in_paise,
    orderStatus: order.status,
    storedOrderId: order.razorpay_order_id,
    duplicate,
  });
  if (decision.action === "ignore") return { ok: true as const, result: decision.reason };
  if (decision.action === "confirm") {
    const applied = await applyPayment(service, order.id, payment, "captured", signature);
    if (!applied.ok) return { ok: false as const, message: "The payment amount does not match this order. The order was not confirmed." };
    if (applied.result === "refund_required") return refundExtraPayment(payment);
    return { ok: true as const, result: applied.result };
  }
  if (decision.action === "record_failed") {
    await applyPayment(service, order.id, payment, "failed");
    return { ok: true as const, result: "failed" };
  }
  if (decision.action === "record_authorized") {
    await applyPayment(service, order.id, payment, "authorized");
    return { ok: true as const, result: "authorized" };
  }
  const settings = razorpaySettings();
  if (!settings) return { ok: false as const, message: "The extra payment could not be refunded because Razorpay is not configured." };
  return refundExtraPayment(payment);
}

async function refundExtraPayment(payment: RazorpayPayment) {
  const settings = razorpaySettings();
  const service = createSupabaseService();
  if (!settings || !service) return { ok: false as const, message: "The extra payment could not be refunded because Razorpay is not configured." };
  const refunded = await refundRazorpayPayment(settings, payment);
  if (!refunded.ok) {
    await service.from("payments").delete().eq("provider", "razorpay").eq("provider_event_id", paymentEventId("captured", payment.id));
    return { ok: false as const, message: "An extra payment could not be refunded. The order was not confirmed again." };
  }
  return { ok: true as const, result: "refunded" };
}

async function alreadyRecorded(service: NonNullable<ReturnType<typeof createSupabaseService>>, payment: RazorpayPayment, status: "captured" | "failed" | "authorized") {
  const existing = await service
    .from("payments")
    .select("id")
    .eq("provider", "razorpay")
    .eq("provider_event_id", paymentEventId(status, payment.id))
    .maybeSingle();
  return Boolean(existing.data);
}

export async function reconcileRazorpayOrder(reference: string) {
  const settings = razorpaySettings();
  if (!settings) return;
  const loaded = await loadPayableOrder(reference);
  if (!loaded.ok || loaded.order.status !== "pending_payment" || !loaded.order.razorpay_order_id) return;
  const listed = await fetchRazorpayOrderPayments(settings, loaded.order.razorpay_order_id);
  if (!listed.ok) return;
  for (const payment of listed.payments) {
    const status = payment.status === "captured" ? "captured" : payment.status === "failed" ? "failed" : payment.status === "authorized" ? "authorized" : null;
    if (!status) continue;
    const duplicate = await alreadyRecorded(loaded.service, payment, status);
    const event = status === "captured" ? "payment.captured" : status === "failed" ? "payment.failed" : "payment.authorized";
    await applyRazorpayDecision(loaded.order, payment, event, duplicate);
  }
}

export async function prepareRazorpayCheckout(reference: string): Promise<
  { ok: true; alreadyPaid: true; reference: string } | { ok: true; checkout: RazorpayCheckoutPayload } | { ok: false; message: string }
> {
  const settings = razorpaySettings();
  if (!settings) return { ok: false, message: "Razorpay is not configured. No payment was taken." };
  const loaded = await loadPayableOrder(reference);
  if (!loaded.ok) return loaded;
  if (loaded.order.status === "confirmed" || loaded.order.status === "processing" || loaded.order.status === "shipped" || loaded.order.status === "delivered") {
    return { ok: true, alreadyPaid: true, reference };
  }
  if (loaded.order.status !== "pending_payment") return { ok: false, message: "This order is no longer waiting for payment." };
  await reconcileRazorpayOrder(reference);
  const refreshed = await loadPayableOrder(reference);
  if (!refreshed.ok) return refreshed;
  if (refreshed.order.status !== "pending_payment") return { ok: true, alreadyPaid: true, reference };
  if (refreshed.order.razorpay_order_id) {
    return { ok: true, checkout: checkoutPayload(refreshed.order, refreshed.order.razorpay_order_id, settings.keyId) };
  }
  const created = await createRazorpayOrder(settings, refreshed.order.total_in_paise, refreshed.order.reference);
  if (!created.ok) return { ok: false, message: "Razorpay could not start the payment. Nothing was charged." };
  const saved = await refreshed.service
    .from("orders")
    .update({ razorpay_order_id: created.orderId })
    .eq("id", refreshed.order.id)
    .is("razorpay_order_id", null)
    .select("razorpay_order_id")
    .maybeSingle();
  if (saved.error) return { ok: false, message: "Apply the Razorpay migration before taking payment. Nothing was charged." };
  const stored = (saved.data as { razorpay_order_id: string } | null)?.razorpay_order_id ?? created.orderId;
  if (!saved.data) {
    const current = await loadPayableOrder(reference);
    if (current.ok && current.order.razorpay_order_id) {
      return { ok: true, checkout: checkoutPayload(current.order, current.order.razorpay_order_id, settings.keyId) };
    }
  }
  return { ok: true, checkout: checkoutPayload(refreshed.order, stored, settings.keyId) };
}

export async function verifyRazorpayCheckout(body: unknown) {
  const parsed = parseCheckoutCallback(body);
  if (!parsed.ok) return parsed;
  const settings = razorpaySettings();
  if (!settings) return { ok: false as const, message: "Razorpay is not configured. The order was not confirmed." };
  const loaded = await loadPayableOrder(parsed.reference);
  if (!loaded.ok) return loaded;
  if (!loaded.order.razorpay_order_id || parsed.orderId !== loaded.order.razorpay_order_id) {
    return { ok: false as const, message: "This payment does not belong to the order. The order was not confirmed." };
  }
  const expected = checkoutSignature(settings.keySecret, loaded.order.razorpay_order_id, parsed.paymentId);
  if (!signaturesMatch(expected, parsed.signature)) {
    return { ok: false as const, message: "The payment signature was rejected. The order was not confirmed." };
  }
  const fetched = await fetchRazorpayPayment(settings, parsed.paymentId);
  if (!fetched.ok) return { ok: false as const, message: "The payment could not be checked with Razorpay. Refresh the order page. It was not confirmed from this page." };
  const duplicate = await alreadyRecorded(loaded.service, fetched.payment, fetched.payment.status === "captured" ? "captured" : fetched.payment.status === "failed" ? "failed" : "authorized");
  const event = fetched.payment.status === "captured" ? "checkout.verified" : fetched.payment.status === "failed" ? "payment.failed" : "payment.authorized";
  const applied = await applyRazorpayDecision(loaded.order, fetched.payment, event, duplicate, parsed.signature);
  if (!applied.ok) return applied;
  if (fetched.payment.status === "captured" && (applied.result === "confirmed" || applied.result === "duplicate" || applied.result === "applied")) {
    return { ok: true as const, reference: parsed.reference, payment: "Paid" as const };
  }
  if (applied.result === "authorized") {
    return { ok: true as const, reference: parsed.reference, payment: "Authorised, not captured" as const };
  }
  return { ok: true as const, reference: parsed.reference, payment: "Unpaid" as const };
}

export async function refundCapturedRazorpayPayments(orderId: string) {
  const settings = razorpaySettings();
  const service = createSupabaseService();
  if (!settings || !service) return { ok: true as const };
  const rows = await service.from("payments").select("provider_event_id, amount_in_paise, status").eq("order_id", orderId).eq("provider", "razorpay").eq("status", "captured");
  for (const row of (rows.data as { provider_event_id: string; amount_in_paise: number }[] | null) ?? []) {
    const paymentId = row.provider_event_id.startsWith("captured:") ? row.provider_event_id.slice("captured:".length) : "";
    if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) continue;
    const refunded = await refundRazorpayPayment(settings, {
      id: paymentId,
      orderId: "order_refund",
      amount: row.amount_in_paise,
      currency: "INR",
      status: "captured",
    });
    if (!refunded.ok) return { ok: false as const, message: "The payment could not be refunded, so the order was not cancelled." };
  }
  return { ok: true as const };
}

export async function processRazorpayWebhook(rawBody: string, signature: string | null) {
  const settings = razorpaySettings();
  if (!settings?.webhookSecret) {
    return { status: 503 as const, body: { ok: false, message: "The Razorpay webhook secret is not configured. No payment status was changed." } };
  }
  const expected = webhookSignature(settings.webhookSecret, rawBody);
  if (!signaturesMatch(expected, signature)) {
    return { status: 400 as const, body: { ok: false, message: "The webhook signature was rejected." } };
  }
  const parsed = parseRazorpayWebhook(rawBody);
  if (!parsed.ok || !parsed.payment) return { status: 200 as const, body: { ok: true, result: "ignored" } };
  const service = createSupabaseService();
  if (!service) return { status: 503 as const, body: { ok: false, message: "The server key is not configured. No payment status was changed." } };
  const found = await service
    .from("orders")
    .select("id, reference, status, total_in_paise, razorpay_order_id, contact_name, contact_email, contact_phone")
    .eq("razorpay_order_id", parsed.payment.orderId)
    .maybeSingle();
  const order = found.data as OrderPaymentRow | null;
  if (!order) return { status: 200 as const, body: { ok: true, result: "ignored" } };
  const status = parsed.payment.status === "captured" ? "captured" : parsed.payment.status === "failed" ? "failed" : parsed.payment.status === "authorized" ? "authorized" : null;
  if (!status) return { status: 200 as const, body: { ok: true, result: "ignored" } };
  const duplicate = await alreadyRecorded(service, parsed.payment, status);
  const applied = await applyRazorpayDecision(order, parsed.payment, parsed.name, duplicate);
  if (!applied.ok) return { status: 500 as const, body: { ok: false, result: "retry" } };
  return { status: 200 as const, body: { ok: true, result: applied.result } };
}
