import type { Metadata } from "next";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { getCategory } from "@/lib/categories";
import { getByCategory } from "@/lib/catalog";

const category = getCategory("men");

export const metadata: Metadata = {
  title: "Men",
  description: category?.description,
};

export default function MenPage() {
  return (
    <ScopedCatalog
      eyebrow="Menswear"
      title="Men"
      description={category?.description}
      products={getByCategory("men")}
    />
  );
}
