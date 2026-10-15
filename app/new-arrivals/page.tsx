import type { Metadata } from "next";
import { CatalogueBoundary } from "@/components/catalogue-boundary";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The latest menswear, womenswear, and accessories from ZEVORA.",
};

export default function NewArrivalsPage() {
  return (
    <CatalogueBoundary
      eyebrow="Just in"
      title="New arrivals"
      description="The latest denim, sweats, tailoring, and accessories."
      filter="new"
    />
  );
}
