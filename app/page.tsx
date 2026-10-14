import {
  BrandStory,
  CategoryTiles,
  EditorialLook,
  Hero,
  ProductSection,
} from "@/components/home-sections";
import { Newsletter } from "@/components/newsletter";
import { getBestsellers, getNewArrivals } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <ProductSection
        title="New arrivals"
        href="/new-arrivals"
        products={getNewArrivals().slice(0, 8)}
      />
      <ProductSection
        title="Bestsellers"
        href="/bestsellers"
        products={getBestsellers().slice(0, 8)}
      />
      <BrandStory />
      <EditorialLook />
      <Newsletter />
    </>
  );
}
