import type { Metadata } from "next";
import { subcategoryParams } from "@/lib/catalog";
import { SubcategoryBoundary } from "@/components/catalogue-boundary";
import { getSubcategory } from "@/lib/categories";

import { publicPage } from "@/lib/seo";

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
  const label = known?.label ?? "Men";
  return publicPage(`/men/${subcategory}`, label, `${label} for men at ZEVORA.`);
}

export default function MenSubcategoryPage({ params }: { params: Promise<{ subcategory: string }> }) {
  return <SubcategoryBoundary category="men" params={params} />;
}
