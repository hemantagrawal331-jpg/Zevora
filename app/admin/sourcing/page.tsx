import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { ArchiveButton } from "@/components/admin/archive-button";
import { SourcingHeader } from "@/components/admin/sourcing-header";
import { SourcingConfigMessage, SourcingSkeleton, SourcingStorageMessage } from "@/components/admin/sourcing-states";
import { Container } from "@/components/container";
import { sourcingStorageConfigured } from "@/lib/admin/config";
import { requireAdmin } from "@/lib/admin/guard";
import { formatPrice } from "@/lib/format";
import { sourcingCategories } from "@/lib/sourcing/categories";
import { departmentLabels, formatCheckedDate, sourcingNotices, workflowLabels } from "@/lib/sourcing/labels";
import { getSourcingRepository } from "@/lib/sourcing/postgres";
import { createSourcingService } from "@/lib/sourcing/service";
import type { SourcingDepartment, SourcingPage, WorkflowStatus } from "@/lib/sourcing/types";
import { normalizeMeeshoUrl, parseSourcingQuery } from "@/lib/sourcing/validation";

type Query = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export const metadata: Metadata = {
  title: "Sourcing",
};

const subcategories = [...new Set(Object.values(sourcingCategories).flat())];
const statuses = Object.keys(workflowLabels) as WorkflowStatus[];

export default function SourcingPage({ searchParams }: { searchParams: Promise<Query> }) {
  return (
    <Suspense fallback={<SourcingSkeleton />}>
      <SourcingList searchParams={searchParams} />
    </Suspense>
  );
}

async function SourcingList({ searchParams }: { searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const next = queryPath(raw);
  const parsed = parseSourcingQuery({
    q: one(raw.q),
    department: one(raw.department),
    subcategory: one(raw.subcategory),
    status: one(raw.status),
    archived: one(raw.archived),
    page: one(raw.page),
  });

  const actor = await requireAdmin(next);
  if (!sourcingStorageConfigured()) return <SourcingConfigMessage />;

  let result: SourcingPage | null = null;
  try {
    result = await createSourcingService(getSourcingRepository()).search(actor, parsed);
  } catch (error) {
    unstable_rethrow(error);
    console.error("sourcing_list_failed", error instanceof Error ? error.name : "unknown");
  }
  if (!result) return <SourcingStorageMessage />;

  const notice = sourcingNotices[one(raw.notice) as keyof typeof sourcingNotices];
  const filtered = Boolean(parsed.query || parsed.department || parsed.subcategory || parsed.status || one(raw.archived) === "1");
  const pageCount = Math.ceil(result.total / result.pageSize);

  return (
      <Container className="py-12">
        <SourcingHeader title="Sourcing">
          <Link href="/admin/sourcing/new" className="text-[11px] tracking-[0.16em] uppercase">
            Add a reference
          </Link>
        </SourcingHeader>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-charcoal">
          Manual references only. ZEVORA does not read Meesho pages, and these records cannot be bought on the shop.
        </p>
        {notice ? (
          <p className="mt-6 text-sm" role="status">
            {notice}
          </p>
        ) : null}

        <form method="get" className="mt-10 grid gap-4 border-y border-line py-6 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="text-[11px] tracking-[0.16em] uppercase">Search</span>
            <input
              name="q"
              defaultValue={parsed.query}
              className="mt-2 w-full border border-line bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <FilterSelect name="department" label="Department" defaultValue={parsed.department ?? ""}>
            <option value="">All</option>
            {(Object.keys(departmentLabels) as SourcingDepartment[]).map((department) => (
              <option key={department} value={department}>
                {departmentLabels[department]}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect name="subcategory" label="Subcategory" defaultValue={parsed.subcategory ?? ""}>
            <option value="">All</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect name="status" label="Status" defaultValue={parsed.status ?? ""}>
            <option value="">All</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {workflowLabels[status]}
              </option>
            ))}
          </FilterSelect>
          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <input type="checkbox" name="archived" value="1" defaultChecked={one(raw.archived) === "1"} />
            Include archived
          </label>
          <button type="submit" className="h-11 bg-ink px-6 text-[11px] tracking-[0.18em] text-ivory uppercase">
            Apply
          </button>
        </form>

        {result.total === 0 ? (
          <p className="mt-10 text-sm text-charcoal">
            {filtered ? "No records match this search." : "No sourcing records yet."}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-b border-line">
            {result.records.map((record) => {
              const href = normalizeMeeshoUrl(record.meeshoUrl);
              return (
                <li key={record.id} className="grid gap-4 py-6 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <p className="text-[11px] tracking-[0.16em] text-stone uppercase">
                      {departmentLabels[record.department]} · {record.subcategory}
                    </p>
                    <h2 className="mt-2 text-lg">{record.referenceName}</h2>
                    <p className="mt-1 text-sm text-charcoal">{workflowLabels[record.workflowStatus]}</p>
                    <p className="mt-2 text-sm">
                      {record.referencePriceInr
                        ? `Unverified reference · ${formatPrice(record.referencePriceInr)}`
                        : "No reference price"}
                    </p>
                    <p className="mt-1 text-sm text-stone">
                      {record.lastCheckedOn ? `Last checked ${formatCheckedDate(record.lastCheckedOn)}` : "Not checked"}
                    </p>
                    <p className="mt-2 text-xs break-all text-stone">Internal ID {record.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-5">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                        referrerPolicy="no-referrer"
                        className="text-[11px] tracking-[0.16em] uppercase"
                      >
                        Open reference
                      </a>
                    ) : null}
                    <Link href={`/admin/sourcing/${record.id}`} className="text-[11px] tracking-[0.16em] uppercase">
                      Edit
                    </Link>
                    {record.workflowStatus === "ARCHIVED" ? null : <ArchiveButton id={record.id} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {pageCount > 1 ? (
          <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Pagination">
            {parsed.page > 1 ? (
              <Link href={pageHref(raw, parsed.page - 1)} className="text-[11px] tracking-[0.16em] uppercase">
                Previous
              </Link>
            ) : (
              <span />
            )}
            <p>
              Page {parsed.page} of {pageCount}
            </p>
            {parsed.page < pageCount ? (
              <Link href={pageHref(raw, parsed.page + 1)} className="text-[11px] tracking-[0.16em] uppercase">
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Container>
    );
}

function FilterSelect({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="text-[11px] tracking-[0.16em] uppercase">{label}</span>
      <select name={name} defaultValue={defaultValue} className="mt-2 w-full border border-line bg-transparent px-3 py-2 outline-none">
        {children}
      </select>
    </label>
  );
}

function queryPath(raw: Query) {
  const params = new URLSearchParams();
  for (const key of ["q", "department", "subcategory", "status", "archived", "page"] as const) {
    const value = one(raw[key]);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/admin/sourcing?${query}` : "/admin/sourcing";
}

function pageHref(raw: Query, page: number) {
  const params = new URLSearchParams();
  for (const key of ["q", "department", "subcategory", "status", "archived"] as const) {
    const value = one(raw[key]);
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/sourcing?${query}` : "/admin/sourcing";
}
