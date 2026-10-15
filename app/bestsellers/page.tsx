import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { publicPage } from "@/lib/seo";

export const metadata = publicPage("/bestsellers", "Bestsellers", "The most requested pieces from ZEVORA.");

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
