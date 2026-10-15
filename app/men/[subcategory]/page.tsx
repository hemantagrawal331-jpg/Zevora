import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { getCategory, getSubcategory } from "@/lib/categories";
import { getBySubcategory, subcategoryParams } from "@/lib/catalog";

export function generateStaticParams() {
  return subcategoryParams("men");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const sub = getSubcategory("men", subcategory);
  return { title: sub?.label ?? "Men", description: sub ? `${sub.label} for men.` : undefined };
}

export default async function MenSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  const category = getCategory("men");
  const sub = getSubcategory("men", subcategory);
  if (!category || !sub) notFound();

  return (
    <ScopedCatalog
      eyebrow={category.label}
      title={sub.label}
      description={`${sub.label} for men.`}
      products={getBySubcategory("men", subcategory)}
    />
  );
}
