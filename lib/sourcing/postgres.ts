import "server-only";
import postgres, { type Sql } from "postgres";
import { sourcingStorageConfigured } from "@/lib/admin/config";
import { ConfigError } from "@/lib/sourcing/errors";
import type { SourcingRepository } from "@/lib/sourcing/repository";
import type {
  PermissionStatus,
  SourcingDepartment,
  SourcingPage,
  SourcingQuery,
  SourcingRecord,
  WorkflowStatus,
} from "@/lib/sourcing/types";
import { escapeLike, isUuid } from "@/lib/sourcing/validation";

type SourcingRow = {
  id: string;
  reference_name: string;
  meesho_url: string;
  reference_brand: string | null;
  department: SourcingDepartment;
  subcategory: string;
  reference_price_inr: number | string | null;
  reference_price_unverified: boolean;
  last_checked_on: Date | string | null;
  supplier_name: string | null;
  supplier_contact: string | null;
  supplier_reference: string | null;
  wholesale_cost_inr: number | string | null;
  minimum_order_quantity: number | string | null;
  delivery_time: string | null;
  resale_authorization: PermissionStatus;
  authenticity_status: PermissionStatus;
  image_permission: PermissionStatus;
  documentation_reference: string | null;
  internal_notes: string | null;
  workflow_status: WorkflowStatus;
  archived_from_status: WorkflowStatus | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const globalForSql = globalThis as unknown as { zevoraSql?: Sql };

function getSql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new ConfigError();
  if (!globalForSql.zevoraSql) {
    globalForSql.zevoraSql = postgres(url, { max: 1, idle_timeout: 20 });
  }
  return globalForSql.zevoraSql;
}

function filters(sql: Sql, query: SourcingQuery) {
  const pattern = query.query ? `%${escapeLike(query.query)}%` : null;
  return sql`
    WHERE (${query.department}::text IS NULL OR department = ${query.department})
      AND (${query.subcategory}::text IS NULL OR subcategory = ${query.subcategory})
      AND (${query.status}::text IS NULL OR workflow_status = ${query.status})
      AND (
        ${query.includeArchived}::boolean
        OR ${query.status}::text = 'ARCHIVED'
        OR workflow_status <> 'ARCHIVED'
      )
      AND (
        ${pattern}::text IS NULL
        OR reference_name ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(reference_brand, '') ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(supplier_name, '') ILIKE ${pattern} ESCAPE '\\'
        OR subcategory ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(internal_notes, '') ILIKE ${pattern} ESCAPE '\\'
      )
  `;
}

export function createPostgresRepository(): SourcingRepository {
  if (!sourcingStorageConfigured()) throw new ConfigError();

  return {
    async insert(record) {
      const sql = getSql();
      await sql`
        INSERT INTO sourcing_records (
          id, reference_name, meesho_url, reference_brand, department, subcategory,
          reference_price_inr, reference_price_unverified, last_checked_on,
          supplier_name, supplier_contact, supplier_reference, wholesale_cost_inr,
          minimum_order_quantity, delivery_time, resale_authorization, authenticity_status,
          image_permission, documentation_reference, internal_notes, workflow_status,
          archived_from_status, created_at, updated_at
        ) VALUES (
          ${record.id}::uuid,
          ${record.referenceName},
          ${record.meeshoUrl},
          ${record.referenceBrand},
          ${record.department},
          ${record.subcategory},
          ${record.referencePriceInr},
          ${true},
          ${record.lastCheckedOn}::date,
          ${record.supplierName},
          ${record.supplierContact},
          ${record.supplierReference},
          ${record.wholesaleCostInr},
          ${record.minimumOrderQuantity},
          ${record.deliveryTime},
          ${record.resaleAuthorization},
          ${record.authenticityStatus},
          ${record.imagePermission},
          ${record.documentationReference},
          ${record.internalNotes},
          ${record.workflowStatus},
          ${record.archivedFromStatus},
          ${record.createdAt}::timestamptz,
          ${record.updatedAt}::timestamptz
        )
      `;
    },

    async update(record) {
      const sql = getSql();
      await sql`
        UPDATE sourcing_records SET
          reference_name = ${record.referenceName},
          meesho_url = ${record.meeshoUrl},
          reference_brand = ${record.referenceBrand},
          department = ${record.department},
          subcategory = ${record.subcategory},
          reference_price_inr = ${record.referencePriceInr},
          reference_price_unverified = ${true},
          last_checked_on = ${record.lastCheckedOn}::date,
          supplier_name = ${record.supplierName},
          supplier_contact = ${record.supplierContact},
          supplier_reference = ${record.supplierReference},
          wholesale_cost_inr = ${record.wholesaleCostInr},
          minimum_order_quantity = ${record.minimumOrderQuantity},
          delivery_time = ${record.deliveryTime},
          resale_authorization = ${record.resaleAuthorization},
          authenticity_status = ${record.authenticityStatus},
          image_permission = ${record.imagePermission},
          documentation_reference = ${record.documentationReference},
          internal_notes = ${record.internalNotes},
          workflow_status = ${record.workflowStatus},
          archived_from_status = ${record.archivedFromStatus},
          updated_at = ${record.updatedAt}::timestamptz
        WHERE id = ${record.id}::uuid
      `;
    },

    async findById(id) {
      if (!isUuid(id)) return null;
      const sql = getSql();
      const rows = await sql<SourcingRow[]>`
        SELECT * FROM sourcing_records WHERE id = ${id}::uuid
      `;
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async search(query) {
      const sql = getSql();
      const offset = (query.page - 1) * query.pageSize;
      const countRows = await sql<{ total: number | string }[]>`
        SELECT count(*)::int AS total FROM sourcing_records ${filters(sql, query)}
      `;
      const rows = await sql<SourcingRow[]>`
        SELECT * FROM sourcing_records
        ${filters(sql, query)}
        ORDER BY updated_at DESC, id DESC
        LIMIT ${query.pageSize} OFFSET ${offset}
      `;
      const total = Number(countRows[0]?.total ?? 0);
      return {
        records: rows.map(mapRow),
        total: Number.isSafeInteger(total) ? total : 0,
        page: query.page,
        pageSize: query.pageSize,
      } satisfies SourcingPage;
    },
  };
}

function mapRow(row: SourcingRow): SourcingRecord {
  if (row.reference_price_unverified !== true) {
    throw new ConfigError("Sourcing storage could not be reached.");
  }
  return {
    id: row.id,
    referenceName: row.reference_name,
    meeshoUrl: row.meesho_url,
    referenceBrand: row.reference_brand,
    department: row.department,
    subcategory: row.subcategory,
    referencePriceInr: wholeNumber(row.reference_price_inr),
    referencePriceUnverified: true,
    lastCheckedOn: dateOnly(row.last_checked_on),
    supplierName: row.supplier_name,
    supplierContact: row.supplier_contact,
    supplierReference: row.supplier_reference,
    wholesaleCostInr: wholeNumber(row.wholesale_cost_inr),
    minimumOrderQuantity: wholeNumber(row.minimum_order_quantity),
    deliveryTime: row.delivery_time,
    resaleAuthorization: row.resale_authorization,
    authenticityStatus: row.authenticity_status,
    imagePermission: row.image_permission,
    documentationReference: row.documentation_reference,
    internalNotes: row.internal_notes,
    workflowStatus: row.workflow_status,
    archivedFromStatus: row.archived_from_status,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

function wholeNumber(value: number | string | null) {
  if (value === null) return null;
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(amount)) return null;
  return amount;
}

function dateOnly(value: Date | string | null) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function timestamp(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export function getSourcingRepository() {
  return createPostgresRepository();
}
