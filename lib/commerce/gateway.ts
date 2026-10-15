import "server-only";
import { gatewayReady } from "@/lib/commerce/checkout-input";

export function razorpayConfigured() {
  return gatewayReady(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "", process.env.RAZORPAY_KEY_SECRET ?? "");
}
