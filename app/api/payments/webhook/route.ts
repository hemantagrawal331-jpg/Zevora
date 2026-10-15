import { NextResponse } from "next/server";
import { processRazorpayWebhook } from "@/lib/commerce/razorpay-payment";
import { rateLimit, requestIp } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(`webhook:${requestIp(request)}`, 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, message: "Too many webhook requests. No payment status was changed." }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  }
  const rawBody = await request.text();
  const result = await processRazorpayWebhook(rawBody, request.headers.get("x-razorpay-signature"));
  return NextResponse.json(result.body, { status: result.status });
}
