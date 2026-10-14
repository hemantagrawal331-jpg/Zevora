import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getByDepartment } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Men",
  description: "Menswear from ZEVORA: outerwear and knitwear.",
};

export default function MenPage() {
  return (
    <CatalogView
      eyebrow="Menswear"
      title="Men"
      description="Coats, jackets, and knits with a clean shoulder."
      products={getByDepartment("men")}
    />
  );
}
