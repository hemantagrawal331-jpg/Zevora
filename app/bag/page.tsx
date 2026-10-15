import type { Metadata } from "next";
import { Suspense } from "react";
import { BagView } from "@/components/bag-view";
import { getCatalogueProfile } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

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
  const supabase = profile ? await createSupabaseServer() : null;
  const result = supabase
    ? await supabase.from("addresses").select("id, full_name, city, postal_code").eq("user_id", profile?.id ?? "")
    : { data: [] };
  const addresses = ((result.data as { id: string; full_name: string; city: string; postal_code: string }[] | null) ?? []).map((address) => ({
    id: address.id,
    label: `${address.full_name}, ${address.city} ${address.postal_code}`,
  }));
  return <BagView signedIn={Boolean(profile)} addresses={addresses} />;
}
