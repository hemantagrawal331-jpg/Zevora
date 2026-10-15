import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { publicPage } from "@/lib/seo";

export const metadata = publicPage("/shop", "Shop", "Shop menswear, womenswear, and accessories at ZEVORA.");

export default function ShopPage() {
  return (
    <CatalogueBoundary
      eyebrow="The collection"
      title="Shop"
      description="Denim, sweats, tailoring, and the pieces that finish a look."
    />
  );
}
