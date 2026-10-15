import type { AdminActor } from "@/lib/admin/actor";
import { UnauthorizedError, ValidationError } from "@/lib/sourcing/errors";
import type { SourcingRepository } from "@/lib/sourcing/repository";
import type { SourcingDraft, SourcingQuery, WorkflowStatus } from "@/lib/sourcing/types";
import { assertTransitionAllowed, isUuid, parseSourcingDraft } from "@/lib/sourcing/validation";

function assertAdmin(actor: AdminActor | null): asserts actor is AdminActor {
  if (!actor || actor.role !== "admin") throw new UnauthorizedError();
}

export function createSourcingService(repository: SourcingRepository) {
  return {
    async create(actor: AdminActor | null, draft: SourcingDraft) {
      assertAdmin(actor);
      const input = parseSourcingDraft(draft);
      const now = new Date().toISOString();
      const record = {
        ...input,
        id: crypto.randomUUID(),
        workflowStatus: "SHORTLISTED" as const,
        archivedFromStatus: null,
        createdAt: now,
        updatedAt: now,
      };
      await repository.insert(record);
      return record;
    },

    async update(actor: AdminActor | null, id: string, draft: SourcingDraft) {
      assertAdmin(actor);
      if (!isUuid(id)) throw new ValidationError("This sourcing record was not found.");
      const existing = await repository.findById(id);
      if (!existing) throw new ValidationError("This sourcing record was not found.");
      const input = parseSourcingDraft(draft);
      const record = {
        ...existing,
        ...input,
        workflowStatus: existing.workflowStatus,
        archivedFromStatus: existing.archivedFromStatus,
        referencePriceUnverified: true as const,
        updatedAt: new Date().toISOString(),
      };
      await repository.update(record);
      return record;
    },

    async transition(actor: AdminActor | null, id: string, next: WorkflowStatus) {
      assertAdmin(actor);
      if (!isUuid(id)) throw new ValidationError("This sourcing record was not found.");
      const existing = await repository.findById(id);
      if (!existing) throw new ValidationError("This sourcing record was not found.");
      assertTransitionAllowed(existing.workflowStatus, next, existing);
      const record = {
        ...existing,
        workflowStatus: next,
        archivedFromStatus: next === "ARCHIVED" ? existing.workflowStatus : next === "SHORTLISTED" ? null : existing.archivedFromStatus,
        updatedAt: new Date().toISOString(),
      };
      await repository.update(record);
      return record;
    },

    async get(actor: AdminActor | null, id: string) {
      assertAdmin(actor);
      if (!isUuid(id)) return null;
      return repository.findById(id);
    },

    async search(actor: AdminActor | null, query: SourcingQuery) {
      assertAdmin(actor);
      const pageSize = Math.min(50, Math.max(1, Math.trunc(query.pageSize) || 1));
      const page = Math.max(1, Math.trunc(query.page) || 1);
      return repository.search({ ...query, page, pageSize });
    },
  };
}
