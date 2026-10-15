import { NextResponse } from "next/server";
import { safeCustomerNext } from "@/lib/commerce/access";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeCustomerNext(url.searchParams.get("next"));
  const supabase = await createSupabaseServer();
  if (!supabase) return NextResponse.redirect(new URL("/account/login", url.origin));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (code) {
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error) return NextResponse.redirect(new URL("/account/login", url.origin));
  } else if (tokenHash && type) {
    const verified = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "recovery" | "signup" | "email" });
    if (verified.error) return NextResponse.redirect(new URL("/account/login", url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
