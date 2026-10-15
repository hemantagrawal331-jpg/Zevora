import "server-only";
import { redirect } from "next/navigation";
import { catalogueAccess, safeCustomerNext, type CatalogueProfile } from "@/lib/commerce/access";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function getCatalogueProfile(): Promise<CatalogueProfile | null> {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const profile = await supabase.from("profiles").select("id, email, full_name, role").eq("id", user.id).maybeSingle();
  if (profile.error || !profile.data) return null;
  const row = profile.data as { id: string; email: string; full_name: string; role: string };
  return { id: row.id, email: row.email, fullName: row.full_name, role: row.role };
}

export async function requireCatalogueAdmin(nextPath: string) {
  if (!isSupabaseConfigured()) return { ok: false as const, reason: "unconfigured" as const };
  const profile = await getCatalogueProfile();
  const access = catalogueAccess(profile);
  if (!access.ok && access.reason === "signed-out") {
    redirect(`/account/login?next=${encodeURIComponent(safeCustomerNext(nextPath))}`);
  }
  return access;
}

export function adminDenialMessage(reason: "signed-out" | "not-admin" | "unconfigured") {
  if (reason === "unconfigured") {
    return "Supabase is not configured. Add the project URL and anon key before using the catalogue.";
  }
  return "This account cannot manage the catalogue. Administrator access is stored in the database, not in the browser.";
}
