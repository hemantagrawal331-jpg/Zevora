import type { Metadata } from "next";
import { CatalogueBoundary } from "@/components/catalogue-boundary";

export const metadata: Metadata = {
  title: "Bestsellers",
  description: "The most requested pieces from ZEVORA.",
};

export default function BestsellersPage() {
  return (
    <CatalogueBoundary
      eyebrow="Most requested"
      title="Bestsellers"
      description="Pieces customers return to."
      filter="bestsellers"
    />
  );
}
