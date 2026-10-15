import type { Metadata } from "next";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { getCategory } from "@/lib/categories";
import { getByCategory } from "@/lib/catalog";

const category = getCategory("accessories");

export const metadata: Metadata = {
  title: "Accessories",
  description: category?.description,
};

export default function AccessoriesPage() {
  return (
    <ScopedCatalog
      eyebrow="Accessories"
      title="Accessories"
      description={category?.description}
      products={getByCategory("accessories")}
    />
  );
}
