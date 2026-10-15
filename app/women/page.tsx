import type { Metadata } from "next";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { getCategory } from "@/lib/categories";
import { getByCategory } from "@/lib/catalog";

const category = getCategory("women");

export const metadata: Metadata = {
  title: "Women",
  description: category?.description,
};

export default function WomenPage() {
  return (
    <ScopedCatalog
      eyebrow="Womenswear"
      title="Women"
      description={category?.description}
      products={getByCategory("women")}
    />
  );
}
