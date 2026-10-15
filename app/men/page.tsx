import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { getCategory } from "@/lib/categories";
import { publicPage } from "@/lib/seo";

const category = getCategory("men");

export const metadata = publicPage("/men", "Men", category?.description ?? "Menswear at ZEVORA.");

export default function MenPage() {
  return (
    <CatalogueBoundary
      eyebrow="Menswear"
      title="Men"
      description={category?.description}
      category="men"
    />
  );
}
