import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseConfig, serviceRoleKey } from "@/lib/supabase/config";

export function createSupabaseService() {
  const config = publicSupabaseConfig();
  const key = serviceRoleKey();
  if (!config || !key) return null;
  return createClient(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
