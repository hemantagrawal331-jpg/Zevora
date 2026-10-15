"use client";

import { useActionState } from "react";
import { updateOrderStatusAction, type ActionState } from "@/lib/commerce/actions";

const statuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];

export function OrderStatusForm({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateOrderStatusAction, {});
  return (
    <form action={action} className="mt-6 flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="text-[11px] tracking-[0.16em] uppercase">
        Status
        <select name="status" defaultValue={status} className="mt-2 block border border-line bg-transparent px-3 py-2 text-sm">
          {statuses.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <button disabled={pending} className="h-11 bg-ink px-5 text-[11px] tracking-[0.16em] text-ivory uppercase disabled:bg-stone" type="submit">
        {pending ? "Saving" : "Update status"}
      </button>
      {state.error ? <p role="alert" className="text-sm">{state.error}</p> : null}
      {state.message ? <p role="status" className="text-sm">{state.message}</p> : null}
    </form>
  );
}
