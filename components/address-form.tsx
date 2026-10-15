"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/commerce/actions";

export function AddressForm({ action }: { action: (state: ActionState, form: FormData) => Promise<ActionState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const field = "mt-2 w-full border-b border-ink bg-transparent py-3 outline-none";
  return (
    <form action={formAction} className="mt-8 max-w-md space-y-4">
      {["fullName", "phone", "line1", "line2", "city", "state", "postalCode"].map((name) => (
        <label key={name} className="block text-[11px] tracking-[0.16em] uppercase">
          {name}
          <input name={name} className={field} required={name !== "line2"} />
        </label>
      ))}
      <button disabled={pending} className="h-11 bg-ink px-6 text-[11px] tracking-[0.16em] text-ivory uppercase disabled:bg-stone" type="submit">
        {pending ? "Saving" : "Save address"}
      </button>
      {state.error ? <p role="alert" className="text-sm">{state.error}</p> : null}
      {state.message ? <p role="status" className="text-sm">{state.message}</p> : null}
    </form>
  );
}
