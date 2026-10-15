import Link from "next/link";
import { Suspense } from "react";
import { CatalogueShell } from "@/components/admin/catalogue-shell";
import { formatPrice } from "@/lib/format";
import { adminDenialMessage, requireCatalogueAdmin } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export default function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading products…</p>}>
      <ProductsAdmin searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; state?: string }> }) {
  const access = await requireCatalogueAdmin("/admin/products");
  if (!access.ok) {
    return (
      <CatalogueShell title="Products">
        <p className="mt-6 text-sm" role="alert">{adminDenialMessage(access.reason)}</p>
      </CatalogueShell>
    );
  }
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 80);
  const state = params.state === "inactive" ? "inactive" : params.state === "active" ? "active" : "all";
  const supabase = await createSupabaseServer();
  if (!supabase) return <CatalogueShell title="Products"><p className="mt-6 text-sm">Supabase is not configured.</p></CatalogueShell>;

  let productsQuery = supabase.from("products").select("id, name, slug, is_active, is_new_arrival, is_bestseller, category:categories(name)").order("updated_at", { ascending: false }).limit(50);
  if (query) productsQuery = productsQuery.ilike("name", `%${query}%`);
  if (state === "active") productsQuery = productsQuery.eq("is_active", true);
  if (state === "inactive") productsQuery = productsQuery.eq("is_active", false);
  const [products, orders, payments, lowStock] = await Promise.all([
    productsQuery,
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("amount_in_paise").eq("status", "captured"),
    supabase.from("product_variants").select("id", { count: "exact", head: true }).lt("stock_quantity", 3),
  ]);
  const sales = ((payments.data as { amount_in_paise: number }[] | null) ?? []).reduce((total, row) => total + row.amount_in_paise, 0);
  const rows = (products.data as { id: string; name: string; slug: string; is_active: boolean; is_new_arrival: boolean; is_bestseller: boolean; category: { name: string } | { name: string }[] | null }[] | null) ?? [];

  return (
    <CatalogueShell title="Products">
      <dl className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Orders" value={String(orders.count ?? 0)} />
        <Stat label="Captured sales" value={formatPrice(sales)} />
        <Stat label="Shown products" value={String(rows.length)} />
        <Stat label="Low stock variants" value={String(lowStock.count ?? 0)} />
      </dl>
      <p className="mt-3 text-xs text-stone">Captured sales count only payments verified by the server. Pending orders are not treated as revenue.</p>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <form className="flex flex-wrap gap-2">
          <input name="q" defaultValue={query} placeholder="Search name" className="border border-line bg-transparent px-3 py-2" />
          <select name="state" defaultValue={state} className="border border-line bg-transparent px-3 py-2">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="text-[11px] tracking-[0.14em] uppercase" type="submit">Filter</button>
        </form>
        <Link href="/admin/products/new" className="inline-flex h-11 items-center bg-ink px-5 text-[11px] tracking-[0.16em] text-ivory uppercase">New product</Link>
      </div>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {rows.map((product) => (
          <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <Link href={`/admin/products/${product.id}`} className="hover:underline">{product.name}</Link>
              <p className="text-xs text-stone">{categoryName(product.category)} · {product.slug} · {product.is_active ? "Active" : "Inactive"}{product.is_new_arrival ? " · New" : ""}{product.is_bestseller ? " · Bestseller" : ""}</p>
            </div>
            <Link href={`/product/${product.slug}`} className="text-[11px] tracking-[0.14em] uppercase">View</Link>
          </li>
        ))}
        {rows.length === 0 ? <li className="py-8 text-sm">No products match.</li> : null}
      </ul>
    </CatalogueShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line p-4">
      <dt className="text-[11px] tracking-[0.16em] text-stone uppercase">{label}</dt>
      <dd className="mt-2 text-2xl">{value}</dd>
    </div>
  );
}

function categoryName(category: { name: string } | { name: string }[] | null) {
  if (Array.isArray(category)) return category[0]?.name ?? "";
  return category?.name ?? "";
}
