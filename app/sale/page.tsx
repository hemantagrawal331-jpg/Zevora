import type { Metadata } from "next";
import { Suspense } from "react";
import { SaleCatalog } from "@/components/sale-catalog";
import { CatalogSkeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "Sale",
  description: "Reduced pieces from the ZEVORA edit.",
};

export default function SalePage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <SaleCatalog searchParams={searchParams} />
    </Suspense>
  );
}
