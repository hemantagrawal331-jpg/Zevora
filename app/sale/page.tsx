import type { Metadata } from "next";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { getSaleProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Sale",
  description: "Reduced pieces from the ZEVORA edit, priced in rupees.",
};

export default function SalePage() {
  return (
    <ScopedCatalog
      eyebrow="Reduced"
      title="Sale"
      description="Pieces with a lower current price than the original price."
      products={getSaleProducts()}
    />
  );
}
