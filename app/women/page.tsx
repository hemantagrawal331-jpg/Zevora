import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { getCategory } from "@/lib/categories";
import { publicPage } from "@/lib/seo";

const category = getCategory("women");

export const metadata = publicPage("/women", "Women", category?.description ?? "Womenswear at ZEVORA.");

export default function WomenPage() {
  return (
    <CatalogueBoundary
      eyebrow="Womenswear"
      title="Women"
      description={category?.description}
      category="women"
    />
  );
}
