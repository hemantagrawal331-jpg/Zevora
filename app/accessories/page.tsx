import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getByDepartment } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Accessories",
  description: "Bags, jewelry, sunglasses, and scarves from ZEVORA.",
};

export default function AccessoriesPage() {
  return (
    <CatalogView
      eyebrow="Accessories"
      title="Accessories"
      description="Leather, metal, and knit — the pieces that finish a look."
      products={getByDepartment("accessories")}
    />
  );
}
