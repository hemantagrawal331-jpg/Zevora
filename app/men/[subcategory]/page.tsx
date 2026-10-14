import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { getBySubcategory, subcategoryParams } from "@/lib/catalog";
import { subcategoryLabels } from "@/lib/products";

export function generateStaticParams() {
  return subcategoryParams("men");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const label = subcategoryLabels[subcategory] ?? "Men";
  return { title: label };
}

export default async function MenSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  const label = subcategoryLabels[subcategory];
  const products = getBySubcategory("men", subcategory);
  if (!label || products.length === 0) notFound();

  return <CatalogView eyebrow="Men" title={label} products={products} />;
}
