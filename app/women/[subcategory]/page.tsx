import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { getCategory, getSubcategory } from "@/lib/categories";
import { getBySubcategory, subcategoryParams } from "@/lib/catalog";

export function generateStaticParams() {
  return subcategoryParams("women");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const sub = getSubcategory("women", subcategory);
  return { title: sub?.label ?? "Women", description: sub ? `${sub.label} for women.` : undefined };
}

export default async function WomenSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  const category = getCategory("women");
  const sub = getSubcategory("women", subcategory);
  if (!category || !sub) notFound();

  return (
    <ScopedCatalog
      eyebrow={category.label}
      title={sub.label}
      description={`${sub.label} for women.`}
      products={getBySubcategory("women", subcategory)}
    />
  );
}
