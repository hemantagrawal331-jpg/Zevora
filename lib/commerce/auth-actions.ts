"use server";

import { redirect } from "next/navigation";
import { safeCustomerNext } from "@/lib/commerce/access";
import { validateEmail } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function origin() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}

export async function signInAction(_state: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured, so sign-in cannot start." };
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: "Supabase is not configured." };
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (result.error) return { error: "Those details were not accepted. If confirmation is required, open the link in your email first." };
  redirect(safeCustomerNext(String(form.get("next") ?? "")));
}

export async function signUpAction(_state: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured, so registration cannot start." };
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: "Supabase is not configured." };
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const fullName = String(form.get("fullName") ?? "").trim();
  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };
  if (fullName.length < 1 || fullName.length > 80) return { error: "Enter your name." };
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const result = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin()}/auth/callback?next=/account`,
    },
  });
  if (result.error) return { error: "The account could not be created. The email may already be registered." };
  if (result.data.session) redirect("/account");
  return { message: "Account created. If email confirmation is enabled in Supabase, open the link in that message before signing in." };
}

export async function signOutAction() {
  const supabase = await createSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/account");
}

export async function resetPasswordAction(_state: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured, so a reset email cannot be sent." };
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: "Supabase is not configured." };
  const email = String(form.get("email") ?? "");
  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };
  const result = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin()}/auth/callback?next=/account/update-password`,
  });
  if (result.error) return { error: "The reset email could not be requested." };
  return { message: "If that email is registered, Supabase will send a reset link. This app does not confirm whether the inbox exists." };
}

export async function updatePasswordAction(_state: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: "Supabase is not configured." };
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const result = await supabase.auth.updateUser({ password });
  if (result.error) return { error: "The password could not be changed. Open the reset link again." };
  redirect("/account");
}

export async function updateProfileAction(_state: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: "Supabase is not configured." };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Sign in to update your account." };
  const fullName = String(form.get("fullName") ?? "").trim();
  if (fullName.length < 1 || fullName.length > 80) return { error: "Enter your name." };
  const result = await supabase.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);
  if (result.error) return { error: "The profile could not be saved." };
  return { message: "Profile saved." };
}
