import type { Metadata } from "next";
import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { getCategory } from "@/lib/categories";

const category = getCategory("men");

export const metadata: Metadata = {
  title: "Men",
  description: category?.description,
};

export default function MenPage() {
  return (
    <CatalogueBoundary
      eyebrow="Menswear"
      title="Men"
      description={category?.description}
      category="men"
    />
  );
}
