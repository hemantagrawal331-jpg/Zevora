import { Suspense } from "react";
import {
  BrandStory,
  CategoryTiles,
  EditorialLook,
  Hero,
  ProductSection,
} from "@/components/home-sections";
import { Newsletter } from "@/components/newsletter";
import { CatalogSkeleton } from "@/components/skeletons";
import { loadStorefront } from "@/lib/commerce/catalogue";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <Suspense fallback={<CatalogSkeleton />}>
        <HomeProducts />
      </Suspense>
      <BrandStory />
      <Newsletter />
    </>
  );
}

async function HomeProducts() {
  const loaded = await loadStorefront();
  const arrivals = loaded.products.filter((product) => product.isNewArrival).slice(0, 8);
  const bestsellers = loaded.products.filter((product) => product.isBestseller).slice(0, 8);
  const look = loaded.products.find((product) => product.slug === "belted-camel-coat");
  return (
    <>
      {loaded.notice || loaded.error ? (
        <p className="mx-auto max-w-[1600px] px-4 pt-8 text-sm text-charcoal sm:px-6 lg:px-10">
          {loaded.error ?? loaded.notice}
        </p>
      ) : null}
      <ProductSection title="New arrivals" href="/new-arrivals" products={arrivals} />
      <ProductSection title="Bestsellers" href="/bestsellers" products={bestsellers} />
      <EditorialLook href={look ? `/product/${look.slug}` : loaded.source === "database" ? "/shop" : "/product/belted-camel-coat"} />
    </>
  );
}
