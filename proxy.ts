import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, readSessionToken, safeNext } from "@/lib/admin/session";

export async function proxy(request: NextRequest) {
  const session = await readSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (session) return NextResponse.next();
  const next = safeNext(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/sourcing", "/admin/sourcing/:path*"],
};
