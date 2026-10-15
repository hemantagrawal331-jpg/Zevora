import type { Metadata } from "next";
import { subcategoryParams } from "@/lib/catalog";
import { SubcategoryBoundary } from "@/components/catalogue-boundary";
import { getSubcategory } from "@/lib/categories";

import { publicPage } from "@/lib/seo";

export function generateStaticParams() {
  return subcategoryParams("accessories");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  const known = getSubcategory("accessories", subcategory);
  const label = known?.label ?? "Accessories";
  return publicPage(`/accessories/${subcategory}`, label, `${label} from ZEVORA.`);
}

export default function AccessoriesSubcategoryPage({ params }: { params: Promise<{ subcategory: string }> }) {
  return <SubcategoryBoundary category="accessories" params={params} />;
}
