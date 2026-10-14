import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/search-results";
import { CatalogSkeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "Search",
  description: "Search clothing and accessories at ZEVORA.",
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}
