import { NextResponse } from "next/server";
import { loadOrderForViewer } from "@/lib/commerce/load-order";
import { verifyRazorpayCheckout } from "@/lib/commerce/razorpay-payment";
import { rateLimit, requestIp } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(`verify:${requestIp(request)}`, 20, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, message: "Too many payment checks. The order was not confirmed." }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "The payment response could not be read." }, { status: 400 });
  }
  const reference = body && typeof body === "object" && typeof (body as { reference?: string }).reference === "string"
    ? (body as { reference: string }).reference.toUpperCase()
    : "";
  const loaded = reference ? await loadOrderForViewer(reference) : null;
  if (!loaded || loaded.forbidden) {
    return NextResponse.json({ ok: false, message: "This order could not be opened." }, { status: 404 });
  }
  const verified = await verifyRazorpayCheckout(body);
  if (!verified.ok) return NextResponse.json({ ok: false, message: verified.message }, { status: 400 });
  return NextResponse.json({ ok: true, reference: verified.reference, payment: verified.payment });
}
