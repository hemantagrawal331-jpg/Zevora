import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminActor } from "@/lib/admin/actor";
import { ADMIN_COOKIE, readSessionToken, safeNext } from "@/lib/admin/session";

export async function getAdminActor(): Promise<AdminActor | null> {
  const jar = await cookies();
  const session = await readSessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!session) return null;
  return { email: session.sub, role: "admin" };
}

export async function requireAdmin(nextPath: string) {
  const actor = await getAdminActor();
  if (!actor) redirect(`/admin/login?next=${encodeURIComponent(safeNext(nextPath))}`);
  return actor;
}
