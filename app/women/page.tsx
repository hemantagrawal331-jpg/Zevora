import type { Metadata } from "next";
import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { getCategory } from "@/lib/categories";

const category = getCategory("women");

export const metadata: Metadata = {
  title: "Women",
  description: category?.description,
};

export default function WomenPage() {
  return (
    <CatalogueBoundary
      eyebrow="Womenswear"
      title="Women"
      description={category?.description}
      category="women"
    />
  );
}
