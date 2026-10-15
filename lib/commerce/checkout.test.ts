import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { applyMergedCart, mergeCartLines } from "./cart-merge";
import {
  canReadOrder,
  checkoutSubmission,
  describePayment,
  gatewayReady,
  parseCheckoutItems,
  publicOrderError,
  quoteFromCatalogue,
} from "./checkout-input";
import { accessTokenMatches, newOrderAccessToken } from "./order-access";
import { adminCanTransition, customerCanCancel, customerCanRequestReturn, fulfilmentAfterPayment } from "./order-states";
import { quoteCheckout } from "./quote";
import { splitSql } from "../sql/split";

const variantId = "22222222-2222-4222-8222-222222222222";

test("bag totals ignore a tampered client price and reject bad quantities or stock", () => {
  const quoted = quoteFromCatalogue(
    [{ variantId, quantity: 1, clientPriceInPaise: 100 }],
    [{
      id: variantId,
      name: "Indigo jean",
      sku: "ZEV-JEAN-32",
      size: "32",
      color: "Indigo",
      priceInPaise: 100000,
      compareAtPriceInPaise: 150000,
      stockQuantity: 4,
      available: true,
    }],
    null,
  );
  assert.equal(quoted.ok, true);
  if (quoted.ok) {
    assert.equal(quoted.quote.subtotalInPaise, 100000);
    assert.equal(quoted.quote.merchandiseDiscountInPaise, 50000);
    assert.equal(quoted.quote.shippingInPaise, 15000);
    assert.equal(quoted.quote.payableInPaise, 115000);
    assert.equal(quoted.quote.taxInclusive, true);
  }
  assert.equal(quoteCheckout([{
    variantId, name: "Jean", sku: "SKU", size: "32", color: "Indigo", quantity: 0,
    unitPriceInPaise: 100000, stockQuantity: 4, available: true,
  }], null).ok, false);
  assert.equal(quoteCheckout([{
    variantId, name: "Jean", sku: "SKU", size: "32", color: "Indigo", quantity: 2,
    unitPriceInPaise: 100000, stockQuantity: 1, available: true,
  }], null).ok, false);
  assert.equal(quoteCheckout([{
    variantId, name: "Jean", sku: "SKU", size: "32", color: "Indigo", quantity: 1,
    unitPriceInPaise: 100000, stockQuantity: 1, available: false,
  }], null).ok, false);
  const parsed = parseCheckoutItems([{ variantId, quantity: 1, priceInPaise: 1 }]);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal("priceInPaise" in parsed.items[0], false);
  assert.equal(parseCheckoutItems([{ variantId, quantity: -1 }]).ok, false);
});

test("coupons, shipping, and duplicate checkout attempts stay on the server rules", () => {
  const line = {
    variantId, name: "Jean", sku: "SKU", size: "32", color: "Indigo", quantity: 1,
    unitPriceInPaise: 100000, stockQuantity: 2, available: true,
  };
  const coupon = quoteCheckout([line], { code: "WELCOME10", type: "percent", amount: 1000, minSubtotalInPaise: 0, active: true });
  assert.equal(coupon.ok, true);
  if (coupon.ok) assert.equal(coupon.quote.payableInPaise, 105000);
  const free = quoteCheckout([{ ...line, unitPriceInPaise: 500000 }], null);
  assert.equal(free.ok, true);
  if (free.ok) assert.equal(free.quote.shippingInPaise, 0);
  const first = checkoutSubmission(null, { key: "checkout-key-0001", email: "a@b.co" });
  assert.equal(first.ok && first.duplicate, false);
  const again = checkoutSubmission({ key: "checkout-key-0001", email: "a@b.co" }, { key: "checkout-key-0001", email: "a@b.co" });
  assert.equal(again.ok && again.duplicate, true);
  assert.equal(checkoutSubmission({ key: "checkout-key-0001", email: "a@b.co" }, { key: "checkout-key-0001", email: "c@d.co" }).ok, false);
});

test("failed and repeated payment events do not confirm an order", () => {
  assert.equal(fulfilmentAfterPayment("pending_payment", "failed"), "pending_payment");
  assert.equal(fulfilmentAfterPayment("pending_payment", "authorized"), "pending_payment");
  assert.equal(fulfilmentAfterPayment("pending_payment", "success-url"), "pending_payment");
  assert.equal(fulfilmentAfterPayment("payment_failed", "captured"), "payment_failed");
  assert.equal(adminCanTransition("pending_payment", "confirmed"), false);
  const seen = new Set<string>();
  const apply = (current: string, eventId: string, payment: string) => {
    if (seen.has(eventId)) return { status: current, result: "duplicate" as const };
    seen.add(eventId);
    return { status: fulfilmentAfterPayment(current, payment), result: "applied" as const };
  };
  const failed = apply("pending_payment", "evt_fail", "failed");
  assert.equal(failed.status, "pending_payment");
  const repeat = apply(failed.status, "evt_fail", "captured");
  assert.equal(repeat.result, "duplicate");
  assert.equal(repeat.status, "pending_payment");
  assert.equal(describePayment([{ status: "pending" }]), "Unpaid");
  assert.equal(describePayment([{ status: "pending" }, { status: "failed" }]), "Failed");
  assert.equal(describePayment([{ status: "failed" }, { status: "captured" }]), "Paid");
  assert.equal(describePayment([{ status: "captured" }, { status: "failed" }]), "Paid");
  assert.equal(describePayment([{ status: "captured" }]), "Paid");
});

test("order history is limited to the owner or the guest access token", () => {
  assert.equal(canReadOrder({ viewerId: "owner", ownerId: "owner", storedTokenHash: null, presentedTokenHash: null }), true);
  assert.equal(canReadOrder({ viewerId: "other", ownerId: "owner", storedTokenHash: "abc", presentedTokenHash: "nope" }), false);
  const access = newOrderAccessToken();
  assert.equal(accessTokenMatches(access.hash, access.token), true);
  assert.equal(accessTokenMatches(access.hash, "not-the-token"), false);
  assert.equal(canReadOrder({ viewerId: null, ownerId: null, storedTokenHash: access.hash, presentedTokenHash: access.hash }), true);
  assert.equal(customerCanCancel("pending_payment"), true);
  assert.equal(customerCanCancel("shipped"), false);
  const delivered = new Date("2026-10-01T00:00:00.000Z").toISOString();
  assert.equal(customerCanRequestReturn("delivered", delivered, Date.parse("2026-10-10T00:00:00.000Z"), 14), true);
  assert.equal(customerCanRequestReturn("delivered", delivered, Date.parse("2026-10-20T00:00:00.000Z"), 14), false);
  assert.equal(gatewayReady("", ""), false);
  assert.equal(gatewayReady("rzp_test_example", "secret"), true);
});

test("guest and saved carts merge without exceeding stock", () => {
  assert.deepEqual(
    mergeCartLines(
      [{ variantId, quantity: 2, stockQuantity: 5 }],
      [{ variantId, quantity: 2, stockQuantity: 5 }],
    ),
    [{ variantId, quantity: 4 }],
  );
  assert.deepEqual(
    mergeCartLines(
      [{ variantId, quantity: 4, stockQuantity: 5 }],
      [{ variantId, quantity: 2, stockQuantity: 5 }],
    ),
    [{ variantId, quantity: 5 }],
  );
  assert.deepEqual(mergeCartLines([{ variantId, quantity: 1, stockQuantity: 0 }], []), []);
  const local = [
    { variantId, quantity: 1 },
    { variantId: null, quantity: 1 },
  ];
  const remote = [{ variantId, quantity: 2 }];
  assert.deepEqual(applyMergedCart(local, remote), [{ variantId, quantity: 2 }, { variantId: null, quantity: 1 }]);
});

test("checkout sql keeps price calculation inside the order function", () => {
  const source = readFileSync(new URL("../../db/migrations/003_checkout.sql", import.meta.url), "utf8");
  const statements = splitSql(source);
  const create = statements.find((statement) => statement.includes("function public.create_checkout_order"));
  const payment = statements.find((statement) => statement.includes("function public.apply_payment_event"));
  assert.ok(create);
  assert.match(create ?? "", /v_variant\.price_in_paise/);
  assert.equal(create?.includes("p_client_price"), false);
  assert.match(payment ?? "", /pending_payment/);
  assert.match(payment ?? "", /payment_failed/);
  assert.equal(publicOrderError("select secret from passwords"), "The order could not be placed. No payment was taken.");
  assert.equal(publicOrderError("A selected piece is not available in that quantity"), "A selected piece is not available in that quantity.");
});
