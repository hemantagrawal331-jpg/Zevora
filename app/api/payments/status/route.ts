import { NextResponse } from "next/server";
import { describePayment } from "@/lib/commerce/checkout-input";
import { loadOrderForViewer } from "@/lib/commerce/load-order";
import { reconcileRazorpayOrder } from "@/lib/commerce/razorpay-payment";
import { rateLimit, requestIp } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(`status:${requestIp(request)}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, message: "Too many status checks." }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  }
  const reference = new URL(request.url).searchParams.get("reference")?.trim().toUpperCase() ?? "";
  const loaded = await loadOrderForViewer(reference);
  if (!loaded || loaded.forbidden) {
    return NextResponse.json({ ok: false, message: "This order could not be opened." }, { status: 404 });
  }
  if (loaded.order.status === "pending_payment") await reconcileRazorpayOrder(reference);
  const current = loaded.order.status === "pending_payment" ? await loadOrderForViewer(reference) : loaded;
  if (!current || current.forbidden) {
    return NextResponse.json({ ok: false, message: "This order could not be opened." }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    reference: current.order.reference,
    fulfilment: current.order.status,
    payment: describePayment(current.order.payments),
    payableInPaise: current.order.totalInPaise,
  });
}
