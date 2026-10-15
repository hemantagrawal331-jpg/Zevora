import type { Metadata } from "next";
import { subcategoryParams } from "@/lib/catalog";
import { SubcategoryBoundary } from "@/components/catalogue-boundary";
import { getSubcategory } from "@/lib/categories";

import { publicPage } from "@/lib/seo";

export function generateStaticParams() {
  return subcategoryParams("women");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const known = getSubcategory("women", subcategory);
  const label = known?.label ?? "Women";
  return publicPage(`/women/${subcategory}`, label, `${label} for women at ZEVORA.`);
}

export default function WomenSubcategoryPage({ params }: { params: Promise<{ subcategory: string }> }) {
  return <SubcategoryBoundary category="women" params={params} />;
}
