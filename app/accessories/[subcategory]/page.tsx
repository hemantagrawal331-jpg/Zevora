import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { getBySubcategory, subcategoryParams } from "@/lib/catalog";
import { subcategoryLabels } from "@/lib/products";

export function generateStaticParams() {
  return subcategoryParams("accessories");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const label = subcategoryLabels[subcategory] ?? "Accessories";
  return { title: label };
}

export default async function AccessoriesSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  const label = subcategoryLabels[subcategory];
  const products = getBySubcategory("accessories", subcategory);
  if (!label || products.length === 0) notFound();

  return <CatalogView eyebrow="Accessories" title={label} products={products} />;
}
