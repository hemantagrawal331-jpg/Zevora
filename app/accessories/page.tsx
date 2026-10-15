import { CatalogueBoundary } from "@/components/catalogue-boundary";
import { getCategory } from "@/lib/categories";
import { publicPage } from "@/lib/seo";

const category = getCategory("accessories");

export const metadata = publicPage("/accessories", "Accessories", category?.description ?? "Accessories at ZEVORA.");

export default function AccessoriesPage() {
  return (
    <CatalogueBoundary
      eyebrow="Accessories"
      title="Accessories"
      description={category?.description}
      category="accessories"
    />
  );
}
