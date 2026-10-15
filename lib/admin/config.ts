import { isPasswordHash } from "@/lib/admin/password";
import { sessionSecret } from "@/lib/admin/session";

export function adminAuthConfigured() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  return Boolean(email && hash && isPasswordHash(hash) && sessionSecret());
}

export function sourcingStorageConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
