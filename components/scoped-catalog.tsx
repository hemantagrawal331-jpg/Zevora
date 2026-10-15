import { Suspense } from "react";
import { CatalogView } from "@/components/catalog-view";
import { CatalogSkeleton } from "@/components/skeletons";
import type { Product } from "@/lib/products";

export function ScopedCatalog({
  eyebrow,
  title,
  description,
  products,
  requireQuery = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  products: Product[];
  requireQuery?: boolean;
}) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogView
        eyebrow={eyebrow}
        title={title}
        description={description}
        products={products}
        requireQuery={requireQuery}
      />
    </Suspense>
  );
}
