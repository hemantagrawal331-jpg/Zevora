import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { OrderRecord } from "@/components/order-record";
import { loadOrderForViewer } from "@/lib/commerce/load-order";

export const metadata: Metadata = {
  title: "Order",
  description: "ZEVORA order confirmation. Payment status is shown separately from delivery.",
};

export default function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  return (
    <Suspense fallback={<Container className="py-16"><p>Loading order…</p></Container>}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const loaded = await loadOrderForViewer(reference.toUpperCase());
  if (!loaded || loaded.forbidden) {
    return (
      <Container className="max-w-xl py-16">
        <h1 className="font-display text-5xl">Order unavailable</h1>
        <p className="mt-4 text-sm leading-6 text-charcoal">
          This order could not be opened. Use the confirmation from this browser, or sign in to the account that placed it.
        </p>
        <Link href="/account/orders" className="mt-6 inline-flex text-sm underline">Order history</Link>
      </Container>
    );
  }
  return <OrderRecord order={loaded.order} />;
}
