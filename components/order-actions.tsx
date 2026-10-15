"use client";

import { useActionState } from "react";
import { cancelOrderAction, requestReturnAction } from "@/lib/commerce/checkout-actions";

export function OrderActions({
  reference,
  canCancel,
  canReturn,
}: {
  reference: string;
  canCancel: boolean;
  canReturn: boolean;
}) {
  const [cancelState, cancel, cancelling] = useActionState(cancelOrderAction, { message: undefined, error: undefined });
  const [returnState, requestReturn, requesting] = useActionState(requestReturnAction, { message: undefined, error: undefined });
  if (!canCancel && !canReturn) return null;
  return (
    <div className="mt-10 space-y-8">
      {canCancel ? (
        <form action={cancel}>
          <input type="hidden" name="reference" value={reference} />
          <button type="submit" disabled={cancelling} className="h-12 border border-ink px-6 text-[11px] tracking-[0.16em] uppercase disabled:text-stone">
            {cancelling ? "Cancelling" : "Cancel order"}
          </button>
          {cancelState.error ? <p role="alert" className="mt-3 text-sm">{cancelState.error}</p> : null}
          {cancelState.message ? <p role="status" className="mt-3 text-sm">{cancelState.message}</p> : null}
        </form>
      ) : null}
      {canReturn ? (
        <form action={requestReturn} className="max-w-md space-y-3">
          <input type="hidden" name="reference" value={reference} />
          <label className="block text-[11px] tracking-[0.14em] uppercase" htmlFor="return-note">
            Return note, optional
            <textarea id="return-note" name="note" maxLength={500} className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-base outline-none" />
          </label>
          <button type="submit" disabled={requesting} className="h-12 border border-ink px-6 text-[11px] tracking-[0.16em] uppercase disabled:text-stone">
            {requesting ? "Sending" : "Request a return"}
          </button>
          {returnState.error ? <p role="alert" className="text-sm">{returnState.error}</p> : null}
          {returnState.message ? <p role="status" className="text-sm">{returnState.message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
