import type { SourcingPage, SourcingQuery, SourcingRecord } from "@/lib/sourcing/types";

export interface SourcingRepository {
  insert(record: SourcingRecord): Promise<void>;
  update(record: SourcingRecord): Promise<void>;
  findById(id: string): Promise<SourcingRecord | null>;
  search(query: SourcingQuery): Promise<SourcingPage>;
}
