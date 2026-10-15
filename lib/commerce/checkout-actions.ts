"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { mergeCartLines } from "@/lib/commerce/cart-merge";
import {
  parseAddress,
  parseCheckoutItems,
  parseContact,
  paymentMethodForGateway,
  publicOrderError,
  quoteFromCatalogue,
  type CatalogueVariant,
} from "@/lib/commerce/checkout-input";
import { razorpayConfigured } from "@/lib/commerce/gateway";
import { prepareRazorpayCheckout, refundCapturedRazorpayPayments } from "@/lib/commerce/razorpay-payment";
import type { RazorpayCheckoutPayload } from "@/lib/commerce/razorpay";
import { productImageUrl } from "@/lib/commerce/images";
import { loadOrderForViewer } from "@/lib/commerce/load-order";
import { newOrderAccessToken } from "@/lib/commerce/order-access";
import { customerCanCancel, customerCanRequestReturn } from "@/lib/commerce/order-states";
import { checkoutDefaults, type CheckoutQuote, type CouponRule } from "@/lib/commerce/quote";
import { getCatalogueProfile } from "@/lib/commerce/session";
import { isSupabaseConfigured, serviceRoleKey } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseService } from "@/lib/supabase/service";

export type CheckoutResult = { error?: string; reference?: string; warning?: string; razorpay?: RazorpayCheckoutPayload };
export type QuoteResult = { error?: string; quote?: CheckoutQuote };

export type MergeResult = {
  ok: boolean;
  message?: string;
  lines: {
    productId: string;
    variantId: string;
    color: string;
    size: string;
    quantity: number;
    name: string;
    priceInPaise: number;
    compareAtPriceInPaise?: number;
    sku: string;
    stockHint: number;
    imageSrc: string;
    imageAlt: string;
  }[];
};

type VariantRecord = {
  id: string;
  sku: string;
  size_label: string;
  color_name: string;
  price_in_paise: number;
  compare_at_price_in_paise: number | null;
  stock_quantity: number;
  is_active: boolean;
  product_id: string;
  products: { name: string; is_active: boolean } | { name: string; is_active: boolean }[] | null;
};

function productOf(row: VariantRecord) {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;
  return product?.is_active ? product : null;
}

async function catalogueFor(ids: string[]) {
  const supabase = (await createSupabaseServer()) ?? createSupabaseService();
  if (!supabase) return { ok: false as const, message: "Supabase is not configured. No order was placed." };
  const result = await supabase
    .from("product_variants")
    .select("id, sku, size_label, color_name, price_in_paise, compare_at_price_in_paise, stock_quantity, is_active, product_id, products!inner(name, is_active)")
    .in("id", ids);
  if (result.error) return { ok: false as const, message: "The catalogue could not be checked. No order was placed." };
  const catalogue: CatalogueVariant[] = ((result.data as VariantRecord[] | null) ?? []).flatMap((row) => {
    const product = productOf(row);
    if (!product) return [];
    return [{
      id: row.id,
      name: product.name,
      sku: row.sku,
      size: row.size_label,
      color: row.color_name,
      priceInPaise: row.price_in_paise,
      compareAtPriceInPaise: row.compare_at_price_in_paise,
      stockQuantity: row.stock_quantity,
      available: row.is_active,
    }];
  });
  return { ok: true as const, catalogue, client: supabase };
}

async function couponRule(code: string) {
  const cleaned = code.trim().toUpperCase();
  if (!cleaned) return { ok: true as const, coupon: null };
  if (!/^[A-Z0-9-]{3,24}$/.test(cleaned)) return { ok: false as const, message: "That coupon is not valid." };
  const service = createSupabaseService();
  if (!service) return { ok: false as const, message: "Coupons cannot be checked until the server key is configured." };
  const result = await service
    .from("coupons")
    .select("code, discount_type, amount, min_subtotal_in_paise, is_active, expires_at")
    .eq("code", cleaned)
    .maybeSingle();
  const row = result.data as {
    code: string;
    discount_type: "percent" | "fixed";
    amount: number;
    min_subtotal_in_paise: number;
    is_active: boolean;
    expires_at: string | null;
  } | null;
  if (!row || !row.is_active || (row.expires_at && Date.parse(row.expires_at) <= Date.now())) {
    return { ok: false as const, message: "That coupon is not active." };
  }
  const coupon: CouponRule = {
    code: row.code,
    type: row.discount_type,
    amount: row.amount,
    minSubtotalInPaise: row.min_subtotal_in_paise,
    active: true,
  };
  return { ok: true as const, coupon };
}

export async function previewCouponAction(items: { variantId: string; quantity: number }[], code: string): Promise<QuoteResult> {
  const parsed = parseCheckoutItems(items);
  if (!parsed.ok) return { error: parsed.message };
  const loaded = await catalogueFor(parsed.items.map((item) => item.variantId));
  if (!loaded.ok) return { error: loaded.message };
  const coupon = await couponRule(code);
  if (!coupon.ok) return { error: coupon.message };
  const settings = await loaded.client
    .from("checkout_settings")
    .select("free_shipping_above_paise, shipping_paise, tax_rate_bps, tax_inclusive")
    .eq("id", 1)
    .maybeSingle();
  const row = settings.data as { free_shipping_above_paise: number; shipping_paise: number; tax_rate_bps: number; tax_inclusive: boolean } | null;
  const rules = row
    ? { freeShippingAbovePaise: row.free_shipping_above_paise, shippingPaise: row.shipping_paise, taxRateBps: row.tax_rate_bps, taxInclusive: row.tax_inclusive, maxQuantity: checkoutDefaults.maxQuantity }
    : checkoutDefaults;
  const quoted = quoteFromCatalogue(parsed.items, loaded.catalogue, coupon.coupon, rules);
  if (!quoted.ok) return { error: quoted.message };
  return { quote: quoted.quote };
}

async function deliverySnapshot(form: FormData, profileId: string | null, phone: string, email: string, name: string) {
  const addressId = String(form.get("addressId") ?? "");
  if (addressId && addressId !== "new") {
    if (!profileId) return { ok: false as const, message: "Sign in to use a saved address." };
    const supabase = await createSupabaseServer();
    if (!supabase) return { ok: false as const, message: "Supabase is not configured. No order was placed." };
    const result = await supabase.from("addresses").select("full_name, line1, line2, city, state, postal_code").eq("id", addressId).eq("user_id", profileId).maybeSingle();
    const row = result.data as { full_name: string; line1: string; line2: string; city: string; state: string; postal_code: string } | null;
    if (!row) return { ok: false as const, message: "Choose a saved address." };
    const parsed = parseAddress({ line1: row.line1, landmark: row.line2, city: row.city, state: row.state, postalCode: row.postal_code });
    if (!parsed.ok) return parsed;
    return { ok: true as const, address: { fullName: row.full_name || name, phone, email, line1: parsed.line1, line2: parsed.landmark, city: parsed.city, state: parsed.state, postalCode: parsed.postalCode, country: "India" } };
  }
  const parsed = parseAddress({
    line1: String(form.get("line1") ?? ""),
    landmark: String(form.get("landmark") ?? ""),
    city: String(form.get("city") ?? ""),
    state: String(form.get("state") ?? ""),
    postalCode: String(form.get("postalCode") ?? ""),
  });
  if (!parsed.ok) return parsed;
  return { ok: true as const, address: { fullName: name, phone, email, line1: parsed.line1, line2: parsed.landmark, city: parsed.city, state: parsed.state, postalCode: parsed.postalCode, country: "India" } };
}

export async function createCheckoutOrderAction(form: FormData): Promise<CheckoutResult> {
  if (!isSupabaseConfigured() || !serviceRoleKey()) {
    return { error: "Orders cannot be created until Supabase and the server key are configured. No order was placed and no payment was taken." };
  }
  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    return { error: "Your bag could not be read. No order was placed." };
  }
  const items = parseCheckoutItems(rawItems);
  if (!items.ok) return { error: items.message };
  const contact = parseContact({ name: String(form.get("fullName") ?? ""), email: String(form.get("email") ?? ""), phone: String(form.get("phone") ?? "") });
  if (!contact.ok) return { error: contact.message };
  if (form.get("terms") !== "on") return { error: "Accept the terms to place the order." };
  const method = paymentMethodForGateway(razorpayConfigured(), String(form.get("paymentMethod") ?? ""));
  if (!method.ok) return { error: method.message };
  const idempotencyKey = String(form.get("idempotencyKey") ?? "");
  if (!/^[A-Za-z0-9-]{16,80}$/.test(idempotencyKey)) return { error: "Checkout could not be identified. Refresh the page and try again." };
  const profile = await getCatalogueProfile();
  const snapshot = await deliverySnapshot(form, profile?.id ?? null, contact.phone, contact.email, contact.name);
  if (!snapshot.ok) return { error: snapshot.message };
  const coupon = String(form.get("coupon") ?? "").trim().toUpperCase();
  if (coupon && !/^[A-Z0-9-]{3,24}$/.test(coupon)) return { error: "That coupon is not valid." };
  const service = createSupabaseService();
  if (!service) return { error: "Orders cannot be created until the server key is configured. No payment was taken." };
  const access = newOrderAccessToken();
  const placed = await service.rpc("create_checkout_order", {
    p_user: profile?.id ?? null,
    p_email: contact.email,
    p_name: contact.name,
    p_phone: contact.phone,
    p_address: snapshot.address,
    p_items: items.items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
    p_coupon: coupon || null,
    p_idempotency: idempotencyKey,
    p_access_token_hash: access.hash,
  });
  if (placed.error) return { error: publicOrderError(placed.error.message || "") };
  const data = placed.data as { reference?: string; duplicate?: boolean } | null;
  const reference = data?.reference ?? "";
  if (!/^ZV[A-Z0-9]{8}$/.test(reference)) return { error: "The order could not be placed. No payment was taken." };
  if (!data?.duplicate) {
    const jar = await cookies();
    jar.set(`zevora-order-${reference}`, access.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  if (profile) {
    const supabase = await createSupabaseServer();
    const cart = supabase ? await supabase.from("carts").select("id").eq("user_id", profile.id).maybeSingle() : { data: null };
    const cartId = (cart.data as { id: string } | null)?.id;
    if (supabase && cartId) await supabase.from("cart_items").delete().eq("cart_id", cartId).in("variant_id", items.items.map((item) => item.variantId));
  }
  revalidatePath("/account/orders");
  revalidatePath(`/order/${reference}`);
  if (!razorpayConfigured()) return { reference };
  const payment = await prepareRazorpayCheckout(reference);
  if (!payment.ok) return { reference, warning: payment.message };
  if ("alreadyPaid" in payment) return { reference };
  return { reference, razorpay: payment.checkout };
}

async function runOrderChange(reference: string, call: (client: NonNullable<ReturnType<typeof createSupabaseService>>) => PromiseLike<{ error: { message: string } | null }>) {
  const loaded = await loadOrderForViewer(reference);
  if (!loaded || loaded.forbidden) return { error: "This order could not be opened." };
  const profile = await getCatalogueProfile();
  const ownClient = profile && loaded.order.userId === profile.id ? await createSupabaseServer() : null;
  const client = ownClient ?? createSupabaseService();
  if (!client) return { error: "This change needs the server key. Nothing was changed." };
  const result = await call(client as NonNullable<ReturnType<typeof createSupabaseService>>);
  if (result.error) return { error: publicOrderError(result.error.message || "") };
  revalidatePath(`/order/${reference}`);
  revalidatePath("/account/orders");
  return { message: "Saved." };
}

export async function cancelOrderAction(_state: { message?: string; error?: string }, form: FormData): Promise<{ message?: string; error?: string }> {
  const reference = String(form.get("reference") ?? "");
  const loaded = await loadOrderForViewer(reference);
  if (!loaded || loaded.forbidden) return { error: "This order could not be opened." };
  if (!customerCanCancel(loaded.order.status)) return { error: "This order can no longer be cancelled." };
  const refunded = await refundCapturedRazorpayPayments(loaded.order.id);
  if (!refunded.ok) return { error: refunded.message };
  const result = await runOrderChange(reference, (client) => client.rpc("cancel_checkout_order", { p_reference: reference }));
  if (result.error) return result;
  return { message: "The order was cancelled. Reserved pieces were released. A captured Razorpay payment is refunded before cancellation." };
}

export async function requestReturnAction(_state: { message?: string; error?: string }, form: FormData): Promise<{ message?: string; error?: string }> {
  const reference = String(form.get("reference") ?? "");
  const note = String(form.get("note") ?? "").trim().slice(0, 500);
  const loaded = await loadOrderForViewer(reference);
  if (!loaded || loaded.forbidden) return { error: "This order could not be opened." };
  if (!customerCanRequestReturn(loaded.order.status, loaded.order.deliveredAt, Date.now(), loaded.order.returnWindowDays)) {
    return { error: "This order is outside the return window." };
  }
  const result = await runOrderChange(reference, (client) => client.rpc("request_order_return", { p_reference: reference, p_note: note }));
  if (result.error) return result;
  return { message: "Return requested. This does not refund a payment." };
}

export async function beginRazorpayCheckoutAction(reference: string) {
  const loaded = await loadOrderForViewer(reference);
  if (!loaded || loaded.forbidden) return { ok: false as const, message: "This order could not be opened." };
  return prepareRazorpayCheckout(reference);
}

export async function mergeCartAction(guest: { variantId: string; quantity: number }[]): Promise<MergeResult> {
  const supabase = await createSupabaseServer();
  const profile = await getCatalogueProfile();
  if (!supabase || !profile) return { ok: false, message: "Sign in to save the bag.", lines: [] };
  const cartResult = await supabase.from("carts").select("id").eq("user_id", profile.id).maybeSingle();
  let cartId = (cartResult.data as { id: string } | null)?.id;
  if (!cartId) {
    const created = await supabase.from("carts").insert({ user_id: profile.id }).select("id").single();
    if (created.error || !created.data) return { ok: false, message: "The bag could not be saved.", lines: [] };
    cartId = (created.data as { id: string }).id;
  }
  const existing = await supabase.from("cart_items").select("variant_id, quantity").eq("cart_id", cartId);
  const serverItems = (existing.data as { variant_id: string; quantity: number }[] | null) ?? [];
  const guestItems = guest.filter((item) => /^[0-9a-f-]{36}$/i.test(item.variantId) && Number.isInteger(item.quantity) && item.quantity > 0).slice(0, 20);
  const ids = [...new Set([...serverItems.map((item) => item.variant_id), ...guestItems.map((item) => item.variantId)])];
  if (ids.length === 0) return { ok: true, lines: [] };
  const loaded = await catalogueFor(ids);
  if (!loaded.ok) return { ok: false, message: loaded.message, lines: [] };
  const stock = new Map(loaded.catalogue.map((item) => [item.id, item]));
  const merged = mergeCartLines(
    serverItems.flatMap((item) => {
      const variant = stock.get(item.variant_id);
      return variant ? [{ variantId: item.variant_id, quantity: item.quantity, stockQuantity: variant.stockQuantity }] : [];
    }),
    guestItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity, stockQuantity: stock.get(item.variantId)?.stockQuantity ?? 0 })),
  );
  const variantRows = await supabase.from("product_variants").select("id, product_id").in("id", merged.map((item) => item.variantId));
  const productByVariant = new Map(((variantRows.data as { id: string; product_id: string }[] | null) ?? []).map((row) => [row.id, row.product_id]));
  const productIds = [...new Set([...productByVariant.values()])];
  const imagesResult = productIds.length
    ? await supabase.from("product_images").select("product_id, storage_path, alt, sort_order").in("product_id", productIds).order("sort_order", { ascending: true })
    : { data: [] };
  const imageByProduct = new Map<string, { src: string; alt: string }>();
  for (const image of (imagesResult.data as { product_id: string; storage_path: string; alt: string }[] | null) ?? []) {
    if (!imageByProduct.has(image.product_id)) imageByProduct.set(image.product_id, { src: productImageUrl(image.storage_path), alt: image.alt });
  }
  if (merged.length > 0) {
    const saved = await supabase.from("cart_items").upsert(
      merged.map((item) => ({ cart_id: cartId, variant_id: item.variantId, quantity: item.quantity })),
      { onConflict: "cart_id,variant_id" },
    );
    if (saved.error) return { ok: false, message: "The bag could not be saved.", lines: [] };
  }
  const keep = merged.map((item) => item.variantId);
  if (keep.length === 0) await supabase.from("cart_items").delete().eq("cart_id", cartId);
  else await supabase.from("cart_items").delete().eq("cart_id", cartId).not("variant_id", "in", `(${keep.join(",")})`);
  const lines = merged.flatMap((item) => {
    const variant = stock.get(item.variantId);
    const productId = productByVariant.get(item.variantId);
    if (!variant || !productId) return [];
    const image = imageByProduct.get(productId);
    return [{
      productId,
      variantId: item.variantId,
      color: variant.color,
      size: variant.size,
      quantity: item.quantity,
      name: variant.name,
      priceInPaise: variant.priceInPaise,
      compareAtPriceInPaise: variant.compareAtPriceInPaise ?? undefined,
      sku: variant.sku,
      stockHint: variant.stockQuantity,
      imageSrc: image?.src ?? "",
      imageAlt: image?.alt || variant.name,
    }];
  });
  const before = new Set([...serverItems.map((item) => item.variant_id), ...guestItems.map((item) => item.variantId)]);
  const after = new Set(lines.map((line) => line.variantId));
  const removed = [...before].some((id) => !after.has(id));
  return { ok: true, lines, message: removed ? "Some pieces were left out because they are no longer available." : undefined };
}
