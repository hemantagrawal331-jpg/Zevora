import type { Metadata } from "next";
import { subcategoryParams } from "@/lib/catalog";
import { SubcategoryBoundary } from "@/components/catalogue-boundary";
import { getSubcategory } from "@/lib/categories";

export function generateStaticParams() {
  return subcategoryParams("men");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const known = getSubcategory("men", subcategory);
  return { title: known?.label ?? "Men", description: known?.label };
}

export default function MenSubcategoryPage({ params }: { params: Promise<{ subcategory: string }> }) {
  return <SubcategoryBoundary category="men" params={params} />;
}
