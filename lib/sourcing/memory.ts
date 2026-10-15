import type { SourcingRepository } from "@/lib/sourcing/repository";
import type { SourcingPage, SourcingQuery, SourcingRecord } from "@/lib/sourcing/types";

export function createMemoryRepository(): SourcingRepository {
  const records: SourcingRecord[] = [];

  return {
    async insert(record) {
      records.push(record);
    },
    async update(record) {
      const index = records.findIndex((item) => item.id === record.id);
      if (index === -1) return;
      records[index] = record;
    },
    async findById(id) {
      return records.find((item) => item.id === id) ?? null;
    },
    async search(query) {
      return searchRecords(records, query);
    },
  };
}

export function searchRecords(records: SourcingRecord[], query: SourcingQuery): SourcingPage {
  const needle = query.query.toLowerCase();
  const matched = records.filter((record) => {
    const includeArchived = query.includeArchived || query.status === "ARCHIVED";
    if (!includeArchived && record.workflowStatus === "ARCHIVED") return false;
    if (query.department && record.department !== query.department) return false;
    if (query.subcategory && record.subcategory !== query.subcategory) return false;
    if (query.status && record.workflowStatus !== query.status) return false;
    if (!needle) return true;
    const haystack = [record.referenceName, record.referenceBrand, record.supplierName, record.subcategory, record.internalNotes]
      .filter((value): value is string => Boolean(value))
      .join("\n")
      .toLowerCase();
    return haystack.includes(needle);
  });
  matched.sort((left, right) => {
    const byTime = right.updatedAt.localeCompare(left.updatedAt);
    if (byTime !== 0) return byTime;
    return right.id.localeCompare(left.id);
  });
  const start = (query.page - 1) * query.pageSize;
  return {
    records: matched.slice(start, start + query.pageSize),
    total: matched.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}
