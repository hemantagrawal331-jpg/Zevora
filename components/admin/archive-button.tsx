"use client";

import { useActionState } from "react";
import { transitionSourcingAction } from "@/lib/sourcing/actions";

export function ArchiveButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(transitionSourcingAction, {});

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value="ARCHIVED" />
      <button type="submit" disabled={pending} className="text-[11px] tracking-[0.16em] uppercase disabled:opacity-60">
        {pending ? "Archiving" : "Archive"}
      </button>
      {state.formError ? (
        <p className="mt-2 text-sm" role="alert">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
