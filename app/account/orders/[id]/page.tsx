import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { formatPrice } from "@/lib/format";
import { getCatalogueProfile } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Order" };

export default function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Container className="py-16"><p>Loading order…</p></Container>}>
      <CustomerOrder params={params} />
    </Suspense>
  );
}

async function CustomerOrder({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCatalogueProfile();
  if (!profile) redirect("/account/login?next=/account/orders");
  const { id } = await params;
  const supabase = await createSupabaseServer();
  if (!supabase) notFound();
  const orderResult = await supabase.from("orders").select("id, status, total_in_paise, address_snapshot").eq("id", id).maybeSingle();
  const order = orderResult.data as { id: string; status: string; total_in_paise: number; address_snapshot: Record<string, string> } | null;
  if (!order) notFound();
  const itemsResult = await supabase.from("order_items").select("id, product_name, sku, variant_label, unit_price_in_paise, quantity").eq("order_id", id);
  const items = (itemsResult.data as { id: string; product_name: string; sku: string; variant_label: string; unit_price_in_paise: number; quantity: number }[] | null) ?? [];
  return (
    <Container className="max-w-3xl py-12">
      <h1 className="font-display text-5xl">Order</h1>
      <p className="mt-4 text-sm capitalize">{order.status} · {formatPrice(order.total_in_paise)}</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="py-4 text-sm">
            {item.product_name} · {item.variant_label} · {item.sku} · {item.quantity} × {formatPrice(item.unit_price_in_paise)}
          </li>
        ))}
      </ul>
    </Container>
  );
}
