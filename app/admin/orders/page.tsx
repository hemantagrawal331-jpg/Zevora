import Link from "next/link";
import { Suspense } from "react";
import { CatalogueShell } from "@/components/admin/catalogue-shell";
import { formatPrice } from "@/lib/format";
import { adminDenialMessage, requireCatalogueAdmin } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export default function OrdersAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading orders…</p>}>
      <OrdersAdmin searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const access = await requireCatalogueAdmin("/admin/orders");
  if (!access.ok) return <CatalogueShell title="Orders"><p className="mt-6 text-sm">{adminDenialMessage(access.reason)}</p></CatalogueShell>;
  const params = await searchParams;
  const status = params.status ?? "";
  const query = (params.q ?? "").trim().slice(0, 80);
  const supabase = await createSupabaseServer();
  if (!supabase) return <CatalogueShell title="Orders"><p className="mt-6 text-sm">Supabase is not configured.</p></CatalogueShell>;
  let request = supabase.from("orders").select("id, status, total_in_paise, created_at, user_id").order("created_at", { ascending: false }).limit(50);
  if (status) request = request.eq("status", status);
  if (/^[0-9a-f-]{36}$/i.test(query)) request = request.eq("id", query);
  const orders = await request;
  const rows = (orders.data as { id: string; status: string; total_in_paise: number; created_at: string }[] | null) ?? [];
  return (
    <CatalogueShell title="Orders">
      <form className="mt-8 flex flex-wrap gap-2">
        <input name="q" defaultValue={query} placeholder="Order id" className="border border-line bg-transparent px-3 py-2" />
        <select name="status" defaultValue={status} className="border border-line bg-transparent px-3 py-2">
          <option value="">All statuses</option>
          {["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <button className="text-[11px] tracking-[0.14em] uppercase" type="submit">Filter</button>
      </form>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {rows.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <Link href={`/admin/orders/${order.id}`} className="hover:underline">{order.id}</Link>
              <p className="text-xs text-stone">{order.status} · {new Date(order.created_at).toLocaleString("en-IN")}</p>
            </div>
            <p>{formatPrice(order.total_in_paise)}</p>
          </li>
        ))}
        {rows.length === 0 ? <li className="py-8 text-sm">No orders match.</li> : null}
      </ul>
    </CatalogueShell>
  );
}
