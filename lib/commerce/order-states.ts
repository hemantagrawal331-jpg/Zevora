export const fulfilmentStatuses = [
  "pending_payment",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "payment_failed",
  "cancelled",
  "return_requested",
  "returned",
  "refunded",
] as const;

export type FulfilmentStatus = (typeof fulfilmentStatuses)[number];

const transitions: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  pending_payment: ["confirmed", "payment_failed", "cancelled"],
  payment_failed: ["cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: ["return_requested"],
  return_requested: ["returned", "delivered"],
  returned: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function isFulfilmentStatus(value: string): value is FulfilmentStatus {
  return (fulfilmentStatuses as readonly string[]).includes(value);
}

export function canTransition(from: string, to: string) {
  if (!isFulfilmentStatus(from) || !isFulfilmentStatus(to)) return false;
  return transitions[from].includes(to);
}

export function adminCanTransition(from: string, to: string) {
  if (from === "pending_payment" && (to === "confirmed" || to === "payment_failed")) return false;
  if (from === "returned" && to === "refunded") return false;
  return canTransition(from, to);
}

export function fulfilmentAfterPayment(current: string, paymentStatus: string) {
  if (paymentStatus === "captured" && current === "pending_payment") return "confirmed";
  if (paymentStatus === "failed" && current === "pending_payment") return "payment_failed";
  if (paymentStatus === "refunded" && current === "returned") return "refunded";
  return current;
}

export function customerCanCancel(status: string) {
  return status === "pending_payment" || status === "confirmed";
}

export function customerCanRequestReturn(
  status: string,
  deliveredAt: string | null,
  now?: number,
  windowDays = 14,
) {
  if (status !== "delivered" || !deliveredAt) return false;
  const delivered = Date.parse(deliveredAt);
  const current = now ?? Date.now();
  if (!Number.isFinite(delivered) || !Number.isInteger(windowDays) || windowDays < 0) return false;
  return current <= delivered + windowDays * 24 * 60 * 60 * 1000;
}

export const fulfilmentLabels: Record<FulfilmentStatus, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  payment_failed: "Payment failed",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  returned: "Returned",
  refunded: "Refunded",
};
