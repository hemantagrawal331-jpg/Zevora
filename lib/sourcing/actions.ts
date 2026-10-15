"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { getAdminActor } from "@/lib/admin/guard";
import { ConfigError, UnauthorizedError, ValidationError } from "@/lib/sourcing/errors";
import { getSourcingRepository } from "@/lib/sourcing/postgres";
import { createSourcingService } from "@/lib/sourcing/service";
import { draftFromForm, parseWorkflowStatus } from "@/lib/sourcing/validation";

export type SourcingActionState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
};

function failure(error: unknown, fallback: string): SourcingActionState {
  if (error instanceof ValidationError) {
    return { formError: error.message, fieldErrors: error.fieldErrors };
  }
  if (error instanceof UnauthorizedError || error instanceof ConfigError) {
    return { formError: error.message };
  }
  console.error("sourcing_action_failed", error instanceof Error ? error.name : "unknown");
  return { formError: fallback };
}

export async function createSourcingAction(_state: SourcingActionState, formData: FormData): Promise<SourcingActionState> {
  try {
    const actor = await getAdminActor();
    if (!actor) return { formError: "You do not have access to sourcing records." };
    const service = createSourcingService(getSourcingRepository());
    const record = await service.create(actor, draftFromForm(formData));
    redirect(`/admin/sourcing/${record.id}?notice=created`);
  } catch (error) {
    unstable_rethrow(error);
    return failure(error, "The sourcing record could not be saved.");
  }
}

export async function updateSourcingAction(_state: SourcingActionState, formData: FormData): Promise<SourcingActionState> {
  try {
    const actor = await getAdminActor();
    if (!actor) return { formError: "You do not have access to sourcing records." };
    const id = String(formData.get("id") ?? "");
    const service = createSourcingService(getSourcingRepository());
    await service.update(actor, id, draftFromForm(formData));
    redirect(`/admin/sourcing/${id}?notice=saved`);
  } catch (error) {
    unstable_rethrow(error);
    return failure(error, "The sourcing record could not be saved.");
  }
}

export async function transitionSourcingAction(_state: SourcingActionState, formData: FormData): Promise<SourcingActionState> {
  const id = String(formData.get("id") ?? "");
  const next = parseWorkflowStatus(String(formData.get("status") ?? ""));
  try {
    if (!next) return { formError: "That status change is not available from the current step." };
    const actor = await getAdminActor();
    if (!actor) return { formError: "You do not have access to sourcing records." };
    const service = createSourcingService(getSourcingRepository());
    await service.transition(actor, id, next);
    const notice = next === "ARCHIVED" ? "archived" : "updated";
    redirect(next === "ARCHIVED" ? "/admin/sourcing?notice=archived" : `/admin/sourcing/${id}?notice=${notice}`);
  } catch (error) {
    unstable_rethrow(error);
    return failure(error, "The status could not be updated.");
  }
}
