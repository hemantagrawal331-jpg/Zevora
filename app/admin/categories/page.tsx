import { Suspense } from "react";
import { CatalogueShell } from "@/components/admin/catalogue-shell";
import { CategoryForm } from "@/components/admin/category-form";
import { setCategoryActiveAction } from "@/lib/commerce/actions";
import { adminDenialMessage, requireCatalogueAdmin } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export default function CategoriesAdminPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading categories…</p>}>
      <CategoriesAdmin />
    </Suspense>
  );
}

async function CategoriesAdmin() {
  const access = await requireCatalogueAdmin("/admin/categories");
  if (!access.ok) return <CatalogueShell title="Categories"><p className="mt-6 text-sm">{adminDenialMessage(access.reason)}</p></CatalogueShell>;
  const supabase = await createSupabaseServer();
  const rows = supabase
    ? await supabase.from("categories").select("id, name, slug, department, parent_id, is_active, sort_order").order("sort_order")
    : { data: [] };
  const categories = (rows.data as { id: string; name: string; slug: string; department: string; parent_id: string | null; is_active: boolean }[] | null) ?? [];
  const departments = categories.filter((category) => category.parent_id === null);
  return (
    <CatalogueShell title="Categories">
      <p className="mt-4 max-w-xl text-sm text-charcoal">Departments stay Men, Women, and Accessories. Add subcategories here. They show in navigation when Supabase is configured.</p>
      <CategoryForm departments={departments} />
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {categories.filter((category) => category.parent_id).map((category) => (
          <li key={category.id} className="flex items-center justify-between gap-4 py-3">
            <p className="text-sm">{category.department} / {category.name} <span className="text-stone">{category.slug}</span></p>
            <form action={setCategoryActiveAction}>
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="active" value={category.is_active ? "false" : "true"} />
              <button className="text-[11px] tracking-[0.14em] uppercase" type="submit">{category.is_active ? "Hide" : "Show"}</button>
            </form>
          </li>
        ))}
      </ul>
    </CatalogueShell>
  );
}
