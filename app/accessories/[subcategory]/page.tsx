import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { getCategory, getSubcategory } from "@/lib/categories";
import { getBySubcategory, subcategoryParams } from "@/lib/catalog";

export function generateStaticParams() {
  return subcategoryParams("accessories");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const sub = getSubcategory("accessories", subcategory);
  return { title: sub?.label ?? "Accessories", description: sub ? `${sub.label}.` : undefined };
}

export default async function AccessoriesSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  const category = getCategory("accessories");
  const sub = getSubcategory("accessories", subcategory);
  if (!category || !sub) notFound();

  return (
    <ScopedCatalog
      eyebrow={category.label}
      title={sub.label}
      description={sub.label}
      products={getBySubcategory("accessories", subcategory)}
    />
  );
}
