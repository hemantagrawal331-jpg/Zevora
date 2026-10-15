import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/container";
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
  const result = supabase
    ? await supabase.from("orders").select("id, status, total_in_paise, created_at").order("created_at", { ascending: false })
    : { data: [] };
  const orders = (result.data as { id: string; status: string; total_in_paise: number; created_at: string }[] | null) ?? [];
  return (
    <Container className="max-w-3xl py-12">
      <h1 className="font-display text-5xl">Orders</h1>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {orders.map((order) => (
          <li key={order.id} className="flex items-center justify-between py-4 text-sm">
            <Link href={`/account/orders/${order.id}`} className="underline">{order.status}</Link>
            <span>{formatPrice(order.total_in_paise)}</span>
          </li>
        ))}
        {orders.length === 0 ? <li className="py-8 text-sm">No orders yet.</li> : null}
      </ul>
    </Container>
  );
}
