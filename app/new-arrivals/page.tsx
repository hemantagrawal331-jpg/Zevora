import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { publicPage } from "@/lib/seo";

export const metadata = publicPage("/new-arrivals", "New Arrivals", "The latest menswear, womenswear, and accessories from ZEVORA.");

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
