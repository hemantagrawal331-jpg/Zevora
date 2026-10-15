"use server";

import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { adminAuthConfigured } from "@/lib/admin/config";
import { emailsMatch, verifyPassword } from "@/lib/admin/password";
import { ADMIN_COOKIE, SESSION_TTL_SECONDS, adminCookieOptions, createSessionToken, safeNext } from "@/lib/admin/session";

export type LoginState = {
  formError?: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  try {
    if (!adminAuthConfigured()) {
      return { formError: "Admin sign-in is not configured." };
    }
    const expectedEmail = process.env.ADMIN_EMAIL ?? "";
    const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? "";
    const emailOk = emailsMatch(email, expectedEmail);
    const passwordOk = await verifyPassword(password, passwordHash);
    if (!emailOk || !passwordOk) {
      return { formError: "Email or password is incorrect." };
    }
    const token = await createSessionToken(expectedEmail);
    const jar = await cookies();
    jar.set(ADMIN_COOKIE, token, adminCookieOptions(SESSION_TTL_SECONDS));
    redirect(next);
  } catch (error) {
    unstable_rethrow(error);
    console.error("admin_login_failed", error instanceof Error ? error.name : "unknown");
    return { formError: "Sign-in could not be completed." };
  }
}

export async function logoutAction() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", adminCookieOptions(0));
  redirect("/admin/login");
}
