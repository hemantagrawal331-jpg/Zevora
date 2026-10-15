import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { SourcingForm } from "@/components/admin/sourcing-form";
import { SourcingHeader } from "@/components/admin/sourcing-header";
import { SourcingStatus } from "@/components/admin/sourcing-status";
import { SourcingConfigMessage, SourcingSkeleton, SourcingStorageMessage } from "@/components/admin/sourcing-states";
import { Container } from "@/components/container";
import { sourcingStorageConfigured } from "@/lib/admin/config";
import { requireAdmin } from "@/lib/admin/guard";
import { sourcingNotices } from "@/lib/sourcing/labels";
import { getSourcingRepository } from "@/lib/sourcing/postgres";
import { createSourcingService } from "@/lib/sourcing/service";
import { isUuid } from "@/lib/sourcing/validation";

export const metadata: Metadata = {
  title: "Sourcing reference",
};

type Query = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default function EditSourcingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Query>;
}) {
  return (
    <Suspense fallback={<SourcingSkeleton />}>
      <EditSourcing params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditSourcing({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Query>;
}) {
  const { id } = await params;
  const actor = await requireAdmin(`/admin/sourcing/${id}`);
  if (!isUuid(id)) notFound();
  if (!sourcingStorageConfigured()) return <SourcingConfigMessage />;

  let record;
  try {
    record = await createSourcingService(getSourcingRepository()).get(actor, id);
  } catch (error) {
    unstable_rethrow(error);
    console.error("sourcing_record_failed", error instanceof Error ? error.name : "unknown");
    return <SourcingStorageMessage />;
  }
  if (!record) notFound();

  const raw = await searchParams;
  const notice = sourcingNotices[one(raw.notice) as keyof typeof sourcingNotices];

  return (
    <Container className="py-12">
      <div className="max-w-3xl">
      <SourcingHeader title="Reference" />
      <p className="mt-4 text-xs break-all text-stone">Internal ID {record.id}</p>
      {notice ? (
        <p className="mt-6 text-sm" role="status">
          {notice}
        </p>
      ) : null}
      <p className="mt-6">
        <Link href="/admin/sourcing" className="text-[11px] tracking-[0.16em] uppercase">
          All records
        </Link>
      </p>
      <SourcingForm record={record} />
      <SourcingStatus record={record} />
      </div>
    </Container>
  );
}
