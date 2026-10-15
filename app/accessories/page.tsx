import type { Metadata } from "next";
import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { getCategory } from "@/lib/categories";

const category = getCategory("accessories");

export const metadata: Metadata = {
  title: "Accessories",
  description: category?.description,
};

export default function AccessoriesPage() {
  return (
    <CatalogueBoundary
      eyebrow="Accessories"
      title="Accessories"
      description={category?.description}
      category="accessories"
    />
  );
}
