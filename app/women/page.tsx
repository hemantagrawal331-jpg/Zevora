import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getByDepartment } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Women",
  description: "Womenswear from ZEVORA: dresses, tops, knits, and outerwear.",
};

export default function WomenPage() {
  return (
    <CatalogView
      eyebrow="Womenswear"
      title="Women"
      description="Dresses, knits, and coats cut to be worn hard."
      products={getByDepartment("women")}
    />
  );
}
