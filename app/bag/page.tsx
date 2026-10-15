import type { Metadata } from "next";
import { Suspense } from "react";
import { BagView } from "@/components/bag-view";
import { getCatalogueProfile } from "@/lib/commerce/session";

export const metadata: Metadata = {
  title: "Bag",
  description: "Review pieces in your ZEVORA bag.",
};

export default function BagPage() {
  return (
    <Suspense fallback={<BagView />}>
      <BagContent />
    </Suspense>
  );
}

async function BagContent() {
  const profile = await getCatalogueProfile();
  return <BagView signedIn={Boolean(profile)} />;
}
