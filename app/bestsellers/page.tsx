import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getBestsellers } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Bestsellers",
  description: "The pieces most often kept from the ZEVORA edit.",
};

export default function BestsellersPage() {
  return (
    <CatalogView
      eyebrow="Most kept"
      title="Bestsellers"
      description="Coats, knits, and accessories that leave the edit first."
      products={getBestsellers()}
    />
  );
}
