import type { Metadata } from "next";
import { CatalogueBoundary } from "@/components/catalogue-boundary";

export const metadata: Metadata = {
  title: "Search",
  description: "Search clothing and accessories at ZEVORA.",
};

export default function SearchPage() {
  return (
    <CatalogueBoundary
      eyebrow="Search"
      title="Search the collection"
      description="Search by product name, category, or a word such as denim, hoodie, or bag."
      requireQuery
    />
  );
}
