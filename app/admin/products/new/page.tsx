import { Suspense } from "react";
import { CatalogueShell } from "@/components/admin/catalogue-shell";
import { ProductForm } from "@/components/admin/product-form";
import { adminDenialMessage, requireCatalogueAdmin } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export default function NewProductPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading product form…</p>}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  const access = await requireCatalogueAdmin("/admin/products/new");
  if (!access.ok) return <CatalogueShell title="New product"><p className="mt-6 text-sm">{adminDenialMessage(access.reason)}</p></CatalogueShell>;
  const supabase = await createSupabaseServer();
  const categories = supabase
    ? await supabase.from("categories").select("id, name, department, slug").not("parent_id", "is", null).eq("is_active", true).order("name")
    : { data: [] };
  return (
    <CatalogueShell title="New product">
      <ProductForm categories={(categories.data as { id: string; name: string; department: string; slug: string }[] | null) ?? []} />
    </CatalogueShell>
  );
}
