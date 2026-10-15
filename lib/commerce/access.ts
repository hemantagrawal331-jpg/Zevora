export type CatalogueProfile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

export function catalogueAccess(profile: CatalogueProfile | null) {
  if (!profile) return { ok: false as const, reason: "signed-out" as const };
  if (profile.role !== "admin") return { ok: false as const, reason: "not-admin" as const };
  return { ok: true as const, profile };
}

export function safeCustomerNext(value: string | undefined | null) {
  const fallback = "/account";
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\") || decoded.includes("..")) return fallback;
  const path = (decoded.split("#")[0] ?? "").split("?")[0] ?? "";
  const allowed =
    path === "/account" ||
    path.startsWith("/account/") ||
    path === "/bag" ||
    path === "/wishlist" ||
    path === "/admin" ||
    path.startsWith("/admin/products") ||
    path.startsWith("/admin/categories") ||
    path.startsWith("/admin/orders");
  return allowed ? decoded : fallback;
}
