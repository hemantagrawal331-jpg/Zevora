import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { describePayment } from "@/lib/commerce/checkout-input";
import { fulfilmentLabels, isFulfilmentStatus } from "@/lib/commerce/order-states";
import { formatPrice } from "@/lib/format";
import { getCatalogueProfile } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <Suspense fallback={<Container className="py-16"><p>Loading orders…</p></Container>}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  const profile = await getCatalogueProfile();
  if (!profile) redirect("/account/login?next=/account/orders");
  const supabase = await createSupabaseServer();
  if (!supabase) {
    return <Container className="max-w-3xl py-12"><h1 className="font-display text-5xl">Orders</h1><p className="mt-4 text-sm">Supabase is not configured, so orders cannot be loaded.</p></Container>;
  }
  const result = await supabase.from("orders").select("id, reference, status, total_in_paise, created_at, payments(status)").eq("user_id", profile.id).order("created_at", { ascending: false });
  if (result.error) {
    return <Container className="max-w-3xl py-12"><h1 className="font-display text-5xl">Orders</h1><p className="mt-4 text-sm">Orders could not be loaded. Apply db/migrations/003_checkout.sql in the Supabase SQL editor if checkout has not been migrated.</p></Container>;
  }
  const orders = (result.data as { id: string; reference: string | null; status: string; total_in_paise: number; created_at: string; payments: { status: string }[] | null }[] | null) ?? [];
  return (
    <Container className="max-w-3xl py-12">
      <h1 className="font-display text-5xl">Orders</h1>
      <p className="mt-4 text-sm leading-6 text-charcoal">Payment status stays separate from delivery. An order is paid only after a verified payment event.</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {orders.map((order) => {
          const label = isFulfilmentStatus(order.status) ? fulfilmentLabels[order.status] : order.status;
          const href = order.reference ? `/order/${order.reference}` : `/account/orders/${order.id}`;
          return (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
              <div>
                <Link href={href} className="underline">{order.reference || "Order"}</Link>
                <p className="text-xs text-stone">{label} · Payment {describePayment(order.payments ?? [])} · {new Date(order.created_at).toLocaleDateString("en-IN")}</p>
              </div>
              <span>{formatPrice(order.total_in_paise)}</span>
            </li>
          );
        })}
        {orders.length === 0 ? <li className="py-8 text-sm">No orders yet.</li> : null}
      </ul>
    </Container>
  );
}
