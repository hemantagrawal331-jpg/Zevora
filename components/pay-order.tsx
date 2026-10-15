"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openRazorpayCheckout } from "@/components/razorpay-checkout";
import { beginRazorpayCheckoutAction } from "@/lib/commerce/checkout-actions";

export function PayOrder({ reference }: { reference: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function pay() {
    setPending(true);
    setMessage("");
    const result = await beginRazorpayCheckoutAction(reference);
    if (!result.ok) {
      setPending(false);
      setMessage(result.message);
      return;
    }
    if ("alreadyPaid" in result) {
      router.refresh();
      setPending(false);
      setMessage("This order is already paid.");
      return;
    }
    try {
      const opened = await openRazorpayCheckout(result.checkout);
      if (opened.status === "failed" || opened.status === "error") setMessage(opened.message ?? "The payment was not completed.");
    } catch {
      setMessage("Razorpay Checkout could not be loaded. Nothing new was confirmed.");
    }
    setPending(false);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button type="button" onClick={() => void pay()} disabled={pending} className="h-12 bg-ink px-6 text-[11px] tracking-[0.16em] text-ivory uppercase disabled:bg-stone">
        {pending ? "Opening payment" : "Pay with Razorpay"}
      </button>
      {message ? <p role="status" className="mt-3 text-sm">{message}</p> : null}
    </div>
  );
}
