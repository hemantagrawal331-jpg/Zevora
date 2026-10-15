import Link from "next/link";
import { Suspense } from "react";
import { CatalogueShell } from "@/components/admin/catalogue-shell";
import { requireCatalogueAdmin } from "@/lib/commerce/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminHomePage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading administration…</p>}>
      <AdminHome />
    </Suspense>
  );
}

async function AdminHome() {
  const configured = isSupabaseConfigured();
  const access = configured ? await requireCatalogueAdmin("/admin") : null;
  return (
    <CatalogueShell title="Administration">
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/admin/products" className="border border-line p-6 hover:border-ink">
          <h2 className="font-display text-3xl">Catalogue</h2>
          <p className="mt-2 text-sm text-charcoal">Products, photographs, prices, and stock. Requires a Supabase administrator.</p>
        </Link>
        <Link href="/admin/sourcing" className="border border-line p-6 hover:border-ink">
          <h2 className="font-display text-3xl">Sourcing</h2>
          <p className="mt-2 text-sm text-charcoal">The private sourcing workspace still uses its own staff sign-in.</p>
        </Link>
      </div>
      {!configured ? (
        <p className="mt-6 text-sm">Supabase is not configured. Catalogue administration cannot sign anyone in until the environment variables are set.</p>
      ) : null}
      {access && !access.ok ? (
        <p className="mt-6 text-sm" role="alert">This account is signed in, but it is not an administrator. The role is read from the database.</p>
      ) : null}
    </CatalogueShell>
  );
}
