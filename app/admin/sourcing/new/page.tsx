import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SourcingForm } from "@/components/admin/sourcing-form";
import { SourcingHeader } from "@/components/admin/sourcing-header";
import { SourcingConfigMessage, SourcingSkeleton } from "@/components/admin/sourcing-states";
import { Container } from "@/components/container";
import { sourcingStorageConfigured } from "@/lib/admin/config";
import { requireAdmin } from "@/lib/admin/guard";

export const metadata: Metadata = {
  title: "New sourcing reference",
};

export default function NewSourcingPage() {
  return (
    <Suspense fallback={<SourcingSkeleton />}>
      <NewSourcing />
    </Suspense>
  );
}

async function NewSourcing() {
  await requireAdmin("/admin/sourcing/new");
  if (!sourcingStorageConfigured()) return <SourcingConfigMessage />;

  return (
    <Container className="py-12">
      <div className="max-w-3xl">
      <SourcingHeader title="New reference" />
      <p className="mt-4 max-w-xl text-sm leading-6 text-charcoal">
        Save a link you copied by hand. This does not import the Meesho page and does not list a product.
      </p>
      <p className="mt-6">
        <Link href="/admin/sourcing" className="text-[11px] tracking-[0.16em] uppercase">
          All records
        </Link>
      </p>
      <SourcingForm />
      </div>
    </Container>
  );
}
