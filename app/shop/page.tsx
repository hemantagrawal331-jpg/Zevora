import type { Metadata } from "next";
import { CatalogueBoundary } from "@/components/catalogue-boundary";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop menswear, womenswear, and accessories at ZEVORA.",
};

export default function ShopPage() {
  return (
    <CatalogueBoundary
      eyebrow="The collection"
      title="Shop"
      description="Denim, sweats, tailoring, and the pieces that finish a look."
    />
  );
}
