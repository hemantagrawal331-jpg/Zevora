"use client";

import { useActionState } from "react";
import { transitionLabels, workflowLabels } from "@/lib/sourcing/labels";
import { transitionSourcingAction } from "@/lib/sourcing/actions";
import type { SourcingRecord } from "@/lib/sourcing/types";
import { allowedTransitions } from "@/lib/sourcing/validation";

export function SourcingStatus({ record }: { record: SourcingRecord }) {
  const [state, action, pending] = useActionState(transitionSourcingAction, {});
  const next = allowedTransitions(record.workflowStatus);
  const forward = next.find((status) => status !== "REJECTED" && status !== "ARCHIVED");
  const rest = next.filter((status) => status !== forward);

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="text-[11px] tracking-[0.16em] uppercase">Workflow</h2>
      <p className="mt-3 text-sm text-charcoal">
        Current status: {workflowLabels[record.workflowStatus]}. Ready to publish stays in this workspace and does not
        create a product on the shop.
      </p>
      <form action={action} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <input type="hidden" name="id" value={record.id} />
        {forward ? (
          <button
            type="submit"
            name="status"
            value={forward}
            disabled={pending}
            className="h-11 bg-ink px-6 text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal disabled:opacity-60"
          >
            {pending ? "Updating" : transitionLabels[forward]}
          </button>
        ) : null}
        {rest.map((status) => (
          <button
            key={status}
            type="submit"
            name="status"
            value={status}
            disabled={pending}
            className="text-[11px] tracking-[0.16em] uppercase disabled:opacity-60"
          >
            {transitionLabels[status]}
          </button>
        ))}
      </form>
      {state.formError ? (
        <p className="mt-4 text-sm" role="alert">
          {state.formError}
        </p>
      ) : null}
    </section>
  );
}
