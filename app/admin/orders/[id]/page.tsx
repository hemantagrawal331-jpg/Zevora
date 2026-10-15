import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogueShell } from "@/components/admin/catalogue-shell";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { formatPrice } from "@/lib/format";
import { adminDenialMessage, requireCatalogueAdmin } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export default function OrderAdminPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading order…</p>}>
      <OrderAdmin params={params} />
    </Suspense>
  );
}

async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireCatalogueAdmin(`/admin/orders/${id}`);
  if (!access.ok) return <CatalogueShell title="Order"><p className="mt-6 text-sm">{adminDenialMessage(access.reason)}</p></CatalogueShell>;
  const supabase = await createSupabaseServer();
  if (!supabase) return <CatalogueShell title="Order"><p className="mt-6 text-sm">Supabase is not configured.</p></CatalogueShell>;
  const [orderResult, itemsResult, paymentsResult] = await Promise.all([
    supabase.from("orders").select("id, status, subtotal_in_paise, shipping_in_paise, total_in_paise, address_snapshot, created_at").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("id, product_name, sku, variant_label, unit_price_in_paise, quantity").eq("order_id", id),
    supabase.from("payments").select("provider, provider_event_id, status, amount_in_paise, created_at").eq("order_id", id),
  ]);
  const order = orderResult.data as {
    id: string;
    status: string;
    subtotal_in_paise: number;
    shipping_in_paise: number;
    total_in_paise: number;
    address_snapshot: Record<string, string>;
    created_at: string;
  } | null;
  if (!order) notFound();
  const items = (itemsResult.data as { id: string; product_name: string; sku: string; variant_label: string; unit_price_in_paise: number; quantity: number }[] | null) ?? [];
  const payments = (paymentsResult.data as { provider: string; provider_event_id: string; status: string; amount_in_paise: number }[] | null) ?? [];
  return (
    <CatalogueShell title="Order">
      <p className="mt-4 text-sm text-stone">{order.id}</p>
      <p className="mt-2 text-sm">Subtotal {formatPrice(order.subtotal_in_paise)} · Shipping {formatPrice(order.shipping_in_paise)} · Total {formatPrice(order.total_in_paise)}</p>
      <p className="mt-2 text-sm">{order.address_snapshot.fullName}, {order.address_snapshot.line1}, {order.address_snapshot.city} {order.address_snapshot.postalCode}</p>
      <OrderStatusForm id={order.id} status={order.status} />
      <h2 className="mt-10 text-[11px] tracking-[0.16em] uppercase">Items</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="py-3 text-sm">
            {item.product_name} · {item.variant_label} · {item.sku} · {item.quantity} × {formatPrice(item.unit_price_in_paise)}
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-[11px] tracking-[0.16em] uppercase">Payments</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {payments.map((payment) => (
          <li key={payment.provider_event_id}>{payment.provider} · {payment.status} · {formatPrice(payment.amount_in_paise)} · {payment.provider_event_id}</li>
        ))}
        {payments.length === 0 ? <li>No payment events.</li> : null}
      </ul>
      <p className="mt-4 text-xs text-stone">Payment status changes only through the verified webhook. This form does not capture a payment.</p>
    </CatalogueShell>
  );
}
