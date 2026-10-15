import type { Metadata } from "next";
import { CatalogueBoundary } from "@/components/catalogue-boundary";

export const metadata: Metadata = {
  title: "Sale",
  description: "Reduced pieces from the ZEVORA edit, priced in rupees.",
};

export default function SalePage() {
  return (
    <CatalogueBoundary
      eyebrow="Reduced"
      title="Sale"
      description="Pieces with a comparison price higher than the current price."
      filter="sale"
    />
  );
}
