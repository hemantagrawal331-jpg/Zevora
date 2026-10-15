import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { getCatalogueProfile } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Order" };

export default function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Container className="py-16"><p>Loading order…</p></Container>}>
      <CustomerOrder params={params} />
    </Suspense>
  );
}

async function CustomerOrder({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCatalogueProfile();
  if (!profile) {
    redirect("/account/login?next=/account/orders");
    return null;
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSupabaseServer();
  if (!supabase) notFound();
  const result = await supabase.from("orders").select("reference").eq("id", id).eq("user_id", profile.id).maybeSingle();
  const reference = (result.data as { reference: string | null } | null)?.reference;
  if (!reference) notFound();
  redirect(`/order/${reference}`);
  return null;
}
