import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseConfig } from "@/lib/supabase/config";

export function createSupabaseBrowser() {
  const config = publicSupabaseConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.anonKey);
}
