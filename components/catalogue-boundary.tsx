import { Suspense } from "react";
import { CatalogView } from "@/components/catalog-view";
import { CatalogSkeleton } from "@/components/skeletons";
import { loadStorefront, subcategoryIsKnown } from "@/lib/commerce/catalogue";
import { getSubcategory, subcategoryLabel, type CategoryId } from "@/lib/categories";
import { isOnSale, type Product } from "@/lib/products";

export function CatalogueBoundary(props: {
  eyebrow?: string;
  title: string;
  description?: string;
  requireQuery?: boolean;
  filter?: "all" | "new" | "sale" | "bestsellers";
  category?: CategoryId;
  subcategory?: string;
}) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogueResults {...props} />
    </Suspense>
  );
}

export async function CatalogueResults({
  eyebrow,
  title,
  description,
  requireQuery,
  filter = "all",
  category,
  subcategory,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  requireQuery?: boolean;
  filter?: "all" | "new" | "sale" | "bestsellers";
  category?: CategoryId;
  subcategory?: string;
}) {
  const loaded = await loadStorefront();
  const products = selectProducts(loaded.products, filter, category, subcategory);
  const note = loaded.error ?? loaded.notice;
  return (
    <CatalogView
      eyebrow={eyebrow}
      title={title}
      description={[note, description].filter(Boolean).join(" ")}
      products={products}
      requireQuery={requireQuery}
    />
  );
}

function selectProducts(products: Product[], filter: "all" | "new" | "sale" | "bestsellers", category?: CategoryId, subcategory?: string) {
  let next = products.filter((product) => product.isActive);
  if (category) next = next.filter((product) => product.category === category);
  if (subcategory) next = next.filter((product) => product.subcategory === subcategory);
  if (filter === "new") next = next.filter((product) => product.isNewArrival).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter === "bestsellers") next = next.filter((product) => product.isBestseller).sort((a, b) => b.popularity - a.popularity);
  if (filter === "sale") next = next.filter((product) => isOnSale(product));
  return next;
}

export function SubcategoryBoundary({
  category,
  params,
}: {
  category: CategoryId;
  params: Promise<{ subcategory: string }>;
}) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <SubcategoryResults category={category} params={params} />
    </Suspense>
  );
}

async function SubcategoryResults({
  category,
  params,
}: {
  category: CategoryId;
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  const { notFound } = await import("next/navigation");
  if (!(await subcategoryIsKnown(category, subcategory))) notFound();
  const known = getSubcategory(category, subcategory);
  return (
    <CatalogueResults
      eyebrow={category}
      title={known?.label ?? subcategoryLabel(category, subcategory)}
      description={known ? undefined : "This subcategory was added in the catalogue."}
      category={category}
      subcategory={subcategory}
    />
  );
}
