import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogueShell } from "@/components/admin/catalogue-shell";
import { ImageManager } from "@/components/admin/image-manager";
import { ProductForm } from "@/components/admin/product-form";
import { adminDenialMessage, requireCatalogueAdmin } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export default function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading product…</p>}>
      <EditProduct params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const access = await requireCatalogueAdmin(`/admin/products/${id}`);
  if (!access.ok) return <CatalogueShell title="Product"><p className="mt-6 text-sm">{adminDenialMessage(access.reason)}</p></CatalogueShell>;
  const supabase = await createSupabaseServer();
  if (!supabase) return <CatalogueShell title="Product"><p className="mt-6 text-sm">Supabase is not configured.</p></CatalogueShell>;
  const [productResult, categoriesResult, imagesResult, variantsResult] = await Promise.all([
    supabase.from("products").select("id, name, slug, description, category_id, material, fit, care, tags, is_new_arrival, is_bestseller, is_active, category:categories(department)").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name, department, slug").not("parent_id", "is", null).eq("is_active", true).order("name"),
    supabase.from("product_images").select("id, storage_path, alt, sort_order").eq("product_id", id).order("sort_order"),
    supabase.from("product_variants").select("size_label, color_name, color_hex, sku, price_in_paise, compare_at_price_in_paise, stock_quantity").eq("product_id", id),
  ]);
  const product = productResult.data as {
    id: string;
    name: string;
    slug: string;
    description: string;
    category_id: string;
    material: string;
    fit: string;
    care: string;
    tags: string[];
    is_new_arrival: boolean;
    is_bestseller: boolean;
    is_active: boolean;
    category: { department: string } | { department: string }[] | null;
  } | null;
  if (!product) notFound();
  const departmentValue = Array.isArray(product.category) ? product.category[0]?.department : product.category?.department;
  const variants = ((variantsResult.data as {
    size_label: string;
    color_name: string;
    color_hex: string;
    sku: string;
    price_in_paise: number;
    compare_at_price_in_paise: number | null;
    stock_quantity: number;
  }[] | null) ?? []).map((variant) => ({
    size: variant.size_label,
    color: variant.color_name,
    hex: variant.color_hex,
    sku: variant.sku,
    price: (variant.price_in_paise / 100).toString(),
    compare: variant.compare_at_price_in_paise ? (variant.compare_at_price_in_paise / 100).toString() : "",
    stock: String(variant.stock_quantity),
  }));

  return (
    <CatalogueShell title={product.name}>
      {query.saved ? <p className="mt-4 text-sm" role="status">Product created. Add its photographs below.</p> : null}
      <ProductForm
        categories={(categoriesResult.data as { id: string; name: string; department: string; slug: string }[] | null) ?? []}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.category_id,
          department: departmentValue ?? "men",
          material: product.material,
          fit: product.fit,
          care: product.care,
          tags: product.tags.join(", "),
          isNewArrival: product.is_new_arrival,
          isBestseller: product.is_bestseller,
          isActive: product.is_active,
          variants,
        }}
      />
      <ImageManager
        productId={product.id}
        images={((imagesResult.data as { id: string; storage_path: string; alt: string; sort_order: number }[] | null) ?? []).map((image) => ({
          id: image.id,
          storagePath: image.storage_path,
          alt: image.alt,
          sortOrder: image.sort_order,
        }))}
      />
    </CatalogueShell>
  );
}
