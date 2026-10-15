import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { Container } from "@/components/container";
import { razorpayConfigured, razorpayTestMode } from "@/lib/commerce/gateway";
import { getCatalogueProfile } from "@/lib/commerce/session";
import { isSupabaseConfigured, serviceRoleKey } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Delivery details for a ZEVORA order. Payment is confirmed only after the server verifies Razorpay.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Container className="py-16"><p>Loading checkout…</p></Container>}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  const profile = await getCatalogueProfile();
  const supabase = profile ? await createSupabaseServer() : null;
  const result = supabase
    ? await supabase.from("addresses").select("id, full_name, line1, line2, city, state, postal_code").eq("user_id", profile?.id ?? "")
    : { data: [] };
  const addresses = ((result.data as { id: string; full_name: string; line1: string; line2: string; city: string; state: string; postal_code: string }[] | null) ?? []).map((address) => ({
    id: address.id,
    fullName: address.full_name,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
  }));
  return (
    <CheckoutForm
      profile={profile ? { fullName: profile.fullName, email: profile.email } : null}
      addresses={addresses}
      razorpayReady={razorpayConfigured()}
      testMode={razorpayTestMode()}
      canOrder={isSupabaseConfigured() && Boolean(serviceRoleKey())}
    />
  );
}
