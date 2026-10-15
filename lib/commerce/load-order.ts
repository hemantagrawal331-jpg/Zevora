import "server-only";

import { cookies } from "next/headers";
import { accessTokenMatches } from "@/lib/commerce/order-access";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseService } from "@/lib/supabase/service";

export type OrderItemView = {
  id: string;
  productName: string;
  sku: string;
  variantLabel: string;
  unitPriceInPaise: number;
  quantity: number;
};

export type OrderView = {
  id: string;
  reference: string;
  status: string;
  userId: string | null;
  subtotalInPaise: number;
  discountInPaise: number;
  shippingInPaise: number;
  taxInPaise: number;
  taxRateBps: number;
  taxInclusive: boolean;
  totalInPaise: number;
  couponCode: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: Record<string, string>;
  deliveredAt: string | null;
  returnWindowDays: number;
  items: OrderItemView[];
  payments: { status: string; provider: string; amountInPaise: number; createdAt: string }[];
  events: { status: string; message: string; createdAt: string }[];
};

type OrderRow = {
  id: string;
  reference: string;
  status: string;
  user_id: string | null;
  subtotal_in_paise: number;
  discount_in_paise: number;
  shipping_in_paise: number;
  tax_in_paise: number;
  tax_rate_bps: number | null;
  tax_inclusive: boolean | null;
  total_in_paise: number;
  coupon_code: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_snapshot: unknown;
  delivered_at: string | null;
  access_token_hash: string | null;
};

function addressOf(value: unknown) {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      typeof item === "string" ? [[key, item]] : [],
    ),
  );
}

async function readBundle(reference: string, client: NonNullable<ReturnType<typeof createSupabaseService>>) {
  const orderResult = await client
    .from("orders")
    .select("id, reference, status, user_id, subtotal_in_paise, discount_in_paise, shipping_in_paise, tax_in_paise, tax_rate_bps, tax_inclusive, total_in_paise, coupon_code, contact_name, contact_email, contact_phone, address_snapshot, delivered_at, access_token_hash")
    .eq("reference", reference)
    .maybeSingle();
  const row = orderResult.data as OrderRow | null;
  if (!row) return null;
  const [itemsResult, paymentsResult, eventsResult, settingsResult] = await Promise.all([
    client.from("order_items").select("id, product_name, sku, variant_label, unit_price_in_paise, quantity").eq("order_id", row.id),
    client.from("payments").select("status, provider, amount_in_paise, created_at").eq("order_id", row.id).order("created_at", { ascending: true }),
    client.from("order_events").select("status, message, created_at").eq("order_id", row.id).order("created_at", { ascending: true }),
    client.from("checkout_settings").select("return_window_days").eq("id", 1).maybeSingle(),
  ]);
  const settings = settingsResult.data as { return_window_days: number } | null;
  const items = ((itemsResult.data as { id: string; product_name: string; sku: string; variant_label: string; unit_price_in_paise: number; quantity: number }[] | null) ?? []).map((item) => ({
    id: item.id,
    productName: item.product_name,
    sku: item.sku,
    variantLabel: item.variant_label,
    unitPriceInPaise: item.unit_price_in_paise,
    quantity: item.quantity,
  }));
  const payments = ((paymentsResult.data as { status: string; provider: string; amount_in_paise: number; created_at: string }[] | null) ?? []).map((payment) => ({
    status: payment.status,
    provider: payment.provider,
    amountInPaise: payment.amount_in_paise,
    createdAt: payment.created_at,
  }));
  const events = ((eventsResult.data as { status: string; message: string; created_at: string }[] | null) ?? []).map((event) => ({
    status: event.status,
    message: event.message,
    createdAt: event.created_at,
  }));
  const order: OrderView = {
    id: row.id,
    reference: row.reference,
    status: row.status,
    userId: row.user_id,
    subtotalInPaise: row.subtotal_in_paise,
    discountInPaise: row.discount_in_paise ?? 0,
    shippingInPaise: row.shipping_in_paise,
    taxInPaise: row.tax_in_paise ?? 0,
    taxRateBps: row.tax_rate_bps ?? 500,
    taxInclusive: row.tax_inclusive ?? true,
    totalInPaise: row.total_in_paise,
    couponCode: row.coupon_code,
    contactName: row.contact_name ?? addressOf(row.address_snapshot).fullName ?? "",
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_phone ?? addressOf(row.address_snapshot).phone ?? "",
    address: addressOf(row.address_snapshot),
    deliveredAt: row.delivered_at,
    returnWindowDays: settings?.return_window_days ?? 14,
    items,
    payments,
    events,
  };
  return { order, accessTokenHash: row.access_token_hash };
}

export async function loadOrderForViewer(reference: string): Promise<{ forbidden: true } | { forbidden: false; order: OrderView } | null> {
  if (!/^ZV[A-Z0-9]{8}$/.test(reference)) return null;
  const { getCatalogueProfile } = await import("@/lib/commerce/session");
  const profile = await getCatalogueProfile();
  const jar = await cookies();
  const token = jar.get(`zevora-order-${reference}`)?.value ?? null;
  const service = createSupabaseService();
  if (service) {
    const bundle = await readBundle(reference, service);
    if (!bundle) return null;
    const allowed = Boolean(profile && bundle.order.userId === profile.id) || accessTokenMatches(bundle.accessTokenHash, token);
    if (!allowed) return { forbidden: true as const };
    return { forbidden: false as const, order: bundle.order };
  }
  const supabase = await createSupabaseServer();
  if (!supabase || !profile) return { forbidden: true as const };
  const bundle = await readBundle(reference, supabase as NonNullable<ReturnType<typeof createSupabaseService>>);
  if (!bundle || bundle.order.userId !== profile.id) return { forbidden: true as const };
  return { forbidden: false as const, order: bundle.order };
}
