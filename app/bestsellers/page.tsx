import type { Metadata } from "next";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { getBestsellers } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Bestsellers",
  description: "The pieces most often kept from the ZEVORA edit.",
};

export default function BestsellersPage() {
  return (
    <ScopedCatalog
      eyebrow="Most kept"
      title="Bestsellers"
      description="Pieces marked as bestsellers in the demo catalogue."
      products={getBestsellers()}
    />
  );
}
