import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  checkoutSignature,
  decideRazorpayUpdate,
  parseCheckoutCallback,
  parseRazorpayWebhook,
  paymentEventId,
  razorpayOrderBody,
  signaturesMatch,
  webhookSignature,
  type RazorpayPayment,
} from "@/lib/commerce/razorpay";

const payment: RazorpayPayment = {
  id: "pay_testpayment",
  orderId: "order_testorder",
  amount: 199900,
  currency: "INR",
  status: "captured",
};

test("checkout signature uses the key secret and the stored order id", () => {
  const expected = createHmac("sha256", "key-secret").update("order_testorder|pay_testpayment").digest("hex");
  assert.equal(checkoutSignature("key-secret", "order_testorder", "pay_testpayment"), expected);
  assert.equal(signaturesMatch(expected, expected.toUpperCase()), true);
  assert.equal(signaturesMatch(expected, checkoutSignature("other-secret", "order_testorder", "pay_testpayment")), false);
});

test("webhook signature uses the webhook secret and the raw body", () => {
  const raw = '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_testpayment","amount":199900}}}}';
  const formatted = JSON.stringify(JSON.parse(raw), null, 2);
  const webhook = webhookSignature("webhook-secret", raw);
  assert.equal(webhook, createHmac("sha256", "webhook-secret").update(raw).digest("hex"));
  assert.equal(signaturesMatch(webhook, webhookSignature("key-secret", raw)), false);
  assert.equal(signaturesMatch(webhook, webhookSignature("webhook-secret", `${raw} `)), false);
  assert.equal(signaturesMatch(webhook, webhookSignature("webhook-secret", formatted)), false);
  assert.equal(parseRazorpayWebhook(raw).name, "payment.captured");
});

test("checkout callback ignores a client amount", () => {
  const parsed = parseCheckoutCallback({
    razorpay_payment_id: "pay_testpayment",
    razorpay_order_id: "order_testorder",
    razorpay_signature: "a".repeat(64),
    reference: "zvabc12345",
    amount: 1,
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal("amount" in parsed, false);
  assert.equal(parseCheckoutCallback({ razorpay_payment_id: "card_4111", razorpay_order_id: "order_testorder", razorpay_signature: "a".repeat(64), reference: "ZVABC12345" }).ok, false);
});

test("payment decisions confirm only a matching captured payment", () => {
  const base = { payment, orderAmount: 199900, orderStatus: "pending_payment", storedOrderId: "order_testorder", duplicate: false };
  assert.equal(decideRazorpayUpdate({ ...base, event: "payment.captured" }).action, "confirm");
  assert.equal(decideRazorpayUpdate({ ...base, event: "checkout.verified" }).action, "confirm");
  assert.equal(decideRazorpayUpdate({ ...base, event: "payment.captured", duplicate: true }).action, "ignore");
  assert.equal(decideRazorpayUpdate({ ...base, event: "payment.failed", payment: { ...payment, status: "failed" } }).action, "record_failed");
  assert.equal(decideRazorpayUpdate({ ...base, event: "payment.authorized", payment: { ...payment, status: "authorized" } }).action, "record_authorized");
  assert.equal(decideRazorpayUpdate({ ...base, event: "payment.captured", payment: { ...payment, amount: 100 } }).action, "ignore");
  assert.equal(decideRazorpayUpdate({ ...base, event: "payment.captured", payment: { ...payment, currency: "USD" } }).action, "ignore");
  assert.equal(decideRazorpayUpdate({ ...base, event: "payment.captured", orderStatus: "confirmed" }).action, "refund");
  assert.equal(decideRazorpayUpdate({ ...base, event: "payment.captured", orderStatus: "cancelled" }).action, "refund");
  assert.equal(decideRazorpayUpdate({ ...base, event: "payment.captured", orderStatus: "payment_failed" }).action, "refund");
  assert.equal(paymentEventId("captured", payment.id), "captured:pay_testpayment");
  assert.notEqual(paymentEventId("failed", payment.id), paymentEventId("captured", payment.id));
});

test("razorpay order body uses verified paise and INR", () => {
  const body = razorpayOrderBody(199900, "ZVABC12345");
  assert.equal(body.ok, true);
  if (body.ok) {
    assert.equal(body.body.amount, 199900);
    assert.equal(body.body.currency, "INR");
    assert.equal(body.body.payment_capture, true);
  }
  assert.equal(razorpayOrderBody(50, "ZVABC12345").ok, false);
  assert.equal(razorpayOrderBody(50_000_001, "ZVABC12345").ok, false);
});
