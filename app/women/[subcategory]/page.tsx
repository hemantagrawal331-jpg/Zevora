import type { Metadata } from "next";
import { subcategoryParams } from "@/lib/catalog";
import { SubcategoryBoundary } from "@/components/catalogue-boundary";
import { getSubcategory } from "@/lib/categories";

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
  return { title: known?.label ?? "Women", description: known?.label };
}

export default function WomenSubcategoryPage({ params }: { params: Promise<{ subcategory: string }> }) {
  return <SubcategoryBoundary category="women" params={params} />;
}
