"use client";

import type { RazorpayCheckoutPayload } from "@/lib/commerce/razorpay";

type CheckoutResponse = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: () => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded."));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(checkout: RazorpayCheckoutPayload) {
  await loadCheckoutScript();
  if (!window.Razorpay) return { status: "error" as const, message: "Razorpay Checkout could not be loaded. You can retry from the order page." };
  return new Promise<{ status: "verified" | "dismissed" | "failed" | "error"; message?: string }>((resolve) => {
    const instance = new window.Razorpay!({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: checkout.name,
      description: checkout.description,
      order_id: checkout.orderId,
      prefill: checkout.prefill,
      theme: { color: "#171717" },
      handler: async (response: CheckoutResponse) => {
        const verified = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...response, reference: checkout.reference }),
        });
        const result = (await verified.json().catch(() => null)) as { ok?: boolean; payment?: string; message?: string } | null;
        if (!verified.ok || !result?.ok) {
          resolve({ status: "failed", message: result?.message ?? "The payment could not be verified. The order was not confirmed." });
          return;
        }
        if (result.payment !== "Paid") {
          resolve({ status: "failed", message: "The payment is not captured. The order was not confirmed." });
          return;
        }
        resolve({ status: "verified" });
      },
      modal: {
        ondismiss: () => resolve({ status: "dismissed" }),
      },
    });
    instance.on("payment.failed", () => resolve({ status: "failed", message: "The payment was declined. The order was not confirmed. You can retry from the order page." }));
    instance.open();
  });
}
