import type { Metadata } from "next";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { activeProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop menswear, womenswear, and accessories at ZEVORA.",
};

export default function ShopPage() {
  return (
    <ScopedCatalog
      eyebrow="The collection"
      title="Shop"
      description="Denim, sweats, tailoring, and the pieces that finish a look. Sample listings until the ZEVORA photographs are uploaded."
      products={activeProducts()}
    />
  );
}
