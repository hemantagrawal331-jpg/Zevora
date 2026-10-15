import "server-only";
import { razorpaySettings } from "@/lib/commerce/razorpay-api";

export function razorpayConfigured() {
  return razorpaySettings() !== null;
}

export function razorpayTestMode() {
  return razorpaySettings()?.testMode ?? false;
}
