import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { getBySubcategory, subcategoryParams } from "@/lib/catalog";
import { subcategoryLabels } from "@/lib/products";

export function generateStaticParams() {
  return subcategoryParams("women");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const label = subcategoryLabels[subcategory] ?? "Women";
  return { title: label };
}

export default async function WomenSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  const label = subcategoryLabels[subcategory];
  const products = getBySubcategory("women", subcategory);
  if (!label || products.length === 0) notFound();

  return <CatalogView eyebrow="Women" title={label} products={products} />;
}
