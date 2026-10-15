import type { Metadata } from "next";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { getNewArrivals } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The latest menswear, womenswear, and accessories from ZEVORA.",
};

export default function NewArrivalsPage() {
  return (
    <ScopedCatalog
      eyebrow="Just in"
      title="New arrivals"
      description="The latest denim, sweats, tailoring, and accessories."
      products={getNewArrivals()}
    />
  );
}
