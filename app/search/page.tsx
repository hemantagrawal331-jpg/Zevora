import type { Metadata } from "next";
import { ScopedCatalog } from "@/components/scoped-catalog";
import { activeProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Search",
  description: "Search clothing and accessories at ZEVORA.",
};

export default function SearchPage() {
  return (
    <ScopedCatalog
      eyebrow="Search"
      title="Search the collection"
      description="Search by product name, category, or a word such as denim, hoodie, or bag."
      products={activeProducts()}
      requireQuery
    />
  );
}
