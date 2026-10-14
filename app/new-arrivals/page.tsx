import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getNewArrivals } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The latest menswear, womenswear, and accessories from ZEVORA.",
};

export default function NewArrivalsPage() {
  return (
    <CatalogView
      eyebrow="Just in"
      title="New arrivals"
      description="The latest coats, knits, and small accessories."
      products={getNewArrivals()}
    />
  );
}
