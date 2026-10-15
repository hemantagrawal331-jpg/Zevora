import { NextResponse } from "next/server";
import { processRazorpayWebhook } from "@/lib/commerce/razorpay-payment";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const result = await processRazorpayWebhook(rawBody, request.headers.get("x-razorpay-signature"));
  return NextResponse.json(result.body, { status: result.status });
}
