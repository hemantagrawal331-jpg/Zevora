import { NextResponse } from "next/server";
import { parsePaymentEvent, paymentSignaturesMatch } from "@/lib/commerce/payments";
import { createSupabaseService } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "Payment verification is not configured. No payment status was changed." },
      { status: 503 },
    );
  }
  const body = await request.text();
  const valid = await paymentSignaturesMatch(secret, body, request.headers.get("x-zevora-signature"));
  if (!valid) {
    return NextResponse.json({ ok: false, message: "Payment signature was rejected." }, { status: 401 });
  }
  const parsed = parsePaymentEvent(body);
  if (!parsed.ok) return NextResponse.json({ ok: false, message: parsed.message }, { status: 400 });
  const supabase = createSupabaseService();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "The service role is not configured. No payment status was changed." },
      { status: 503 },
    );
  }
  const applied = await supabase.rpc("apply_payment_event", {
    p_provider: parsed.event.provider,
    p_event_id: parsed.event.eventId,
    p_order_id: parsed.event.orderId,
    p_status: parsed.event.status,
    p_amount: parsed.event.amountInPaise,
  });
  if (applied.error) {
    return NextResponse.json({ ok: false, message: "The payment event could not be recorded." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, result: applied.data });
}
