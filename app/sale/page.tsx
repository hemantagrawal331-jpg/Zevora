import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { publicPage } from "@/lib/seo";

export const metadata = publicPage("/sale", "Sale", "Reduced pieces from the ZEVORA edit, priced in rupees.");

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
