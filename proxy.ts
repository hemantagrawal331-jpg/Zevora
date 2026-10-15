import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ADMIN_COOKIE, readSessionToken, safeNext } from "@/lib/admin/session";
import { publicSupabaseConfig } from "@/lib/supabase/config";

async function withSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = publicSupabaseConfig();
  if (!config) return response;
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export async function proxy(request: NextRequest) {
  const response = await withSession(request);
  if (!request.nextUrl.pathname.startsWith("/admin/sourcing")) return response;
  const session = await readSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (session) return response;
  const next = safeNext(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", next);
  const redirect = NextResponse.redirect(login);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/admin/:path*", "/account", "/account/:path*", "/auth/:path*", "/bag", "/wishlist"],
};
