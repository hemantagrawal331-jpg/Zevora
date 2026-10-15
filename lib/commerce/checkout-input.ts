import { checkoutDefaults, quoteCheckout, type CheckoutRules, type CouponRule, type QuoteLineInput } from "@/lib/commerce/quote";

export const indianStates = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

const variantIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CatalogueVariant = {
  id: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  priceInPaise: number;
  compareAtPriceInPaise: number | null;
  stockQuantity: number;
  available: boolean;
};

export function parseCheckoutItems(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    return { ok: false as const, message: "Choose between 1 and 20 pieces." };
  }
  const items: { variantId: string; quantity: number }[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") return { ok: false as const, message: "Your bag could not be read." };
    const row = item as Record<string, unknown>;
    const variantId = typeof row.variantId === "string" ? row.variantId : "";
    if (!variantIdPattern.test(variantId)) {
      return { ok: false as const, message: "A piece in the bag is not from the catalogue." };
    }
    if (seen.has(variantId)) return { ok: false as const, message: "A piece was included twice." };
    seen.add(variantId);
    if (typeof row.quantity !== "number" || !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 5) {
      return { ok: false as const, message: "Choose a quantity from 1 to 5." };
    }
    items.push({ variantId, quantity: row.quantity });
  }
  return { ok: true as const, items };
}

export function quoteFromCatalogue(
  requested: { variantId: string; quantity: number; clientPriceInPaise?: number }[],
  catalogue: CatalogueVariant[],
  coupon: CouponRule | null,
  rules: CheckoutRules = checkoutDefaults,
) {
  const lines: QuoteLineInput[] = [];
  for (const item of requested) {
    const found = catalogue.find((row) => row.id === item.variantId);
    if (!found) return { ok: false as const, message: "A selected piece is not available." };
    lines.push({
      variantId: found.id,
      name: found.name,
      sku: found.sku,
      size: found.size,
      color: found.color,
      quantity: item.quantity,
      unitPriceInPaise: found.priceInPaise,
      compareAtPriceInPaise: found.compareAtPriceInPaise,
      stockQuantity: found.stockQuantity,
      available: found.available,
    });
  }
  return quoteCheckout(lines, coupon, rules);
}

export function parseContact(input: { name: string; email: string; phone: string }) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (name.length < 1 || name.length > 80) return { ok: false as const, message: "Enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, message: "Enter a valid email address." };
  if (!/^[6-9][0-9]{9}$/.test(phone)) return { ok: false as const, message: "Enter a 10-digit mobile number." };
  return { ok: true as const, name, email, phone };
}

export function parseAddress(input: { line1: string; landmark: string; city: string; state: string; postalCode: string }) {
  const line1 = input.line1.trim();
  const landmark = input.landmark.trim();
  const city = input.city.trim();
  const state = input.state.trim();
  const postalCode = input.postalCode.trim();
  if (line1.length < 1 || line1.length > 120) return { ok: false as const, message: "Enter the delivery address." };
  if (landmark.length > 120) return { ok: false as const, message: "The landmark is too long." };
  if (city.length < 1 || city.length > 80) return { ok: false as const, message: "Enter the city." };
  if (!(indianStates as readonly string[]).includes(state)) return { ok: false as const, message: "Choose a state." };
  if (!/^[1-9][0-9]{5}$/.test(postalCode)) return { ok: false as const, message: "Enter a 6-digit PIN code." };
  return { ok: true as const, line1, landmark, city, state, postalCode };
}

export function gatewayReady(keyId: string, keySecret: string) {
  return keyId.trim().startsWith("rzp_") && keySecret.trim().length > 0;
}

export function paymentMethodForGateway(ready: boolean, selected: string) {
  if (!ready) {
    if (selected && selected !== "unconfigured") return { ok: false as const, message: "That payment method is not available." };
    return { ok: true as const, method: null };
  }
  if (selected !== "razorpay") return { ok: false as const, message: "Choose Razorpay to continue." };
  return { ok: true as const, method: "razorpay" as const };
}

export function checkoutSubmission(
  existing: { key: string; email: string } | null,
  incoming: { key: string; email: string },
) {
  if (!/^[A-Za-z0-9-]{16,80}$/.test(incoming.key)) {
    return { ok: false as const, message: "Checkout could not be identified. Refresh the page and try again." };
  }
  if (!existing) return { ok: true as const, duplicate: false };
  if (existing.key !== incoming.key) return { ok: true as const, duplicate: false };
  if (existing.email !== incoming.email) return { ok: false as const, message: "This checkout was already used." };
  return { ok: true as const, duplicate: true };
}

export function canReadOrder(input: {
  viewerId: string | null;
  ownerId: string | null;
  storedTokenHash: string | null;
  presentedTokenHash: string | null;
}) {
  if (input.viewerId && input.ownerId && input.viewerId === input.ownerId) return true;
  return Boolean(
    input.storedTokenHash &&
      input.presentedTokenHash &&
      input.storedTokenHash === input.presentedTokenHash,
  );
}

export function describePayment(events: { status: string }[]) {
  const statuses = new Set(events.map((event) => event.status));
  if (statuses.has("refunded")) return "Refunded";
  if (statuses.has("captured")) return "Paid";
  if (statuses.has("authorized")) return "Authorised, not captured";
  if (statuses.has("failed")) return "Failed";
  return "Unpaid";
}

export function publicOrderError(message: string) {
  const cleaned = message.replace(/^.*ERROR:\s*/i, "").split("\n")[0]?.trim() ?? "";
  if (/^[A-Za-z0-9 ,.'’-]{8,160}$/.test(cleaned) && !/password|secret|stack|select |insert /i.test(cleaned)) {
    return cleaned.endsWith(".") ? cleaned : `${cleaned}.`;
  }
  return "The order could not be placed. No payment was taken.";
}
