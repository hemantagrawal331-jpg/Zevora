"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { catalogueAccess } from "@/lib/commerce/access";
import { isSafeImagePath } from "@/lib/commerce/images";
import { parseProductForm } from "@/lib/commerce/product-input";
import { getCatalogueProfile } from "@/lib/commerce/session";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

export type ActionState = { message?: string; error?: string };

async function adminClient() {
  const profile = await getCatalogueProfile();
  const access = catalogueAccess(profile);
  if (!access.ok) return { ok: false as const, error: access.reason === "signed-out" ? "Sign in as an administrator." : "This account cannot manage the catalogue." };
  const supabase = await createSupabaseServer();
  if (!supabase) return { ok: false as const, error: "Supabase is not configured." };
  return { ok: true as const, supabase };
}

function refreshCatalogue() {
  revalidatePath("/", "layout");
}

export async function saveProductAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const gate = await adminClient();
  if (!gate.ok) return { error: gate.error };
  const parsed = parseProductForm(form);
  if (!parsed.ok) return { error: parsed.message };
  const draft = parsed.draft;
  const category = await gate.supabase
    .from("categories")
    .select("id, department, parent_id")
    .eq("id", draft.categoryId)
    .maybeSingle();
  const categoryRow = category.data as { id: string; department: string; parent_id: string | null } | null;
  if (category.error || !categoryRow?.parent_id || categoryRow.department !== draft.department) {
    return { error: "Choose a subcategory in the selected department." };
  }

  const productValues = {
    category_id: draft.categoryId,
    slug: draft.slug,
    name: draft.name,
    description: draft.description,
    material: draft.material,
    fit: draft.fit,
    care: draft.care,
    tags: draft.tags,
    is_new_arrival: draft.isNewArrival,
    is_bestseller: draft.isBestseller,
    is_active: draft.isActive,
  };
  const saved = draft.id
    ? await gate.supabase.from("products").update(productValues).eq("id", draft.id).select("id").single()
    : await gate.supabase.from("products").insert(productValues).select("id").single();
  if (saved.error || !saved.data) return { error: saved.error?.message.includes("products_slug") ? "That slug is already used." : "The product could not be saved." };
  const productId = (saved.data as { id: string }).id;

  if (draft.id) {
    const removed = await gate.supabase.from("product_variants").delete().eq("product_id", productId);
    if (removed.error) return { error: "Existing variants could not be replaced." };
  }
  const inserted = await gate.supabase.from("product_variants").insert(
    draft.variants.map((variant) => ({
      product_id: productId,
      sku: variant.sku,
      size_label: variant.size,
      color_name: variant.color,
      color_hex: variant.hex,
      price_in_paise: variant.priceInPaise,
      compare_at_price_in_paise: variant.compareAtPriceInPaise,
      stock_quantity: variant.stockQuantity,
      is_active: true,
    })),
  );
  if (inserted.error) return { error: inserted.error.message.includes("sku") ? "A SKU is already used." : "Variants could not be saved." };
  refreshCatalogue();
  if (!draft.id) redirect(`/admin/products/${productId}?saved=1`);
  return { message: "Product updated." };
}

export async function registerProductImageAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const gate = await adminClient();
  if (!gate.ok) return { error: gate.error };
  const productId = String(form.get("productId") ?? "");
  const path = String(form.get("path") ?? "");
  const alt = String(form.get("alt") ?? "").trim().slice(0, 180);
  const color = String(form.get("color") ?? "").trim();
  if (!isSafeImagePath(productId, path)) return { error: "That image path is not allowed." };
  const existing = await gate.supabase.from("product_images").select("sort_order").eq("product_id", productId);
  const sort = ((existing.data as { sort_order: number }[] | null) ?? []).reduce((max, row) => Math.max(max, row.sort_order), -1) + 1;
  const inserted = await gate.supabase.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    alt: alt || "Product photograph",
    color_name: color || null,
    sort_order: sort,
  });
  if (inserted.error) return { error: "The photograph could not be attached to the product." };
  refreshCatalogue();
  return { message: "Photograph added." };
}

export async function removeProductImageAction(form: FormData) {
  const gate = await adminClient();
  if (!gate.ok) return;
  const id = String(form.get("id") ?? "");
  const path = String(form.get("path") ?? "");
  const productId = String(form.get("productId") ?? "");
  if (!isSafeImagePath(productId, path)) return;
  await gate.supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  await gate.supabase.from("product_images").delete().eq("id", id).eq("product_id", productId);
  refreshCatalogue();
}

export async function reorderProductImageAction(form: FormData) {
  const gate = await adminClient();
  if (!gate.ok) return;
  const productId = String(form.get("productId") ?? "");
  const id = String(form.get("id") ?? "");
  const direction = form.get("direction") === "up" ? -1 : 1;
  const images = await gate.supabase.from("product_images").select("id, sort_order").eq("product_id", productId).order("sort_order");
  const rows = (images.data as { id: string; sort_order: number }[] | null) ?? [];
  const index = rows.findIndex((row) => row.id === id);
  const swap = rows[index + direction];
  const current = rows[index];
  if (!current || !swap) return;
  await gate.supabase.from("product_images").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await gate.supabase.from("product_images").update({ sort_order: current.sort_order }).eq("id", swap.id);
  refreshCatalogue();
}

export async function saveCategoryAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const gate = await adminClient();
  if (!gate.ok) return { error: gate.error };
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const department = String(form.get("department") ?? "");
  const parentId = String(form.get("parentId") ?? "");
  if (name.length < 1 || name.length > 80) return { error: "Enter a category name." };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: "Use a lowercase slug." };
  if (department !== "men" && department !== "women" && department !== "accessories") {
    return { error: "Choose Men, Women, or Accessories." };
  }
  if (!/^[0-9a-f-]{36}$/i.test(parentId)) return { error: "Choose a department." };
  const inserted = await gate.supabase.from("categories").insert({
    name,
    slug,
    department,
    parent_id: parentId,
    is_active: true,
  });
  if (inserted.error) return { error: "That subcategory could not be added. The slug may already exist in this department." };
  refreshCatalogue();
  return { message: "Subcategory added. It appears in the shop navigation after the next page load." };
}

export async function setCategoryActiveAction(form: FormData) {
  const gate = await adminClient();
  if (!gate.ok) return;
  const id = String(form.get("id") ?? "");
  const active = form.get("active") === "true";
  await gate.supabase.from("categories").update({ is_active: active }).eq("id", id).not("parent_id", "is", null);
  refreshCatalogue();
}

const orderStatuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];

export async function updateOrderStatusAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const gate = await adminClient();
  if (!gate.ok) return { error: gate.error };
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!orderStatuses.includes(status)) return { error: "Choose a valid order status." };
  const updated = await gate.supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (updated.error) return { error: "The order status could not be changed." };
  revalidatePath("/admin/orders");
  return { message: "Order status updated. Payment status is unchanged." };
}

export async function saveAddressAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServer();
  const profile = await getCatalogueProfile();
  if (!supabase || !profile) return { error: "Sign in to save an address." };
  const address = {
    user_id: profile.id,
    full_name: String(form.get("fullName") ?? "").trim(),
    phone: String(form.get("phone") ?? "").trim(),
    line1: String(form.get("line1") ?? "").trim(),
    line2: String(form.get("line2") ?? "").trim(),
    city: String(form.get("city") ?? "").trim(),
    state: String(form.get("state") ?? "").trim(),
    postal_code: String(form.get("postalCode") ?? "").trim(),
    country: "India",
    is_default: form.get("isDefault") === "on",
  };
  if (address.full_name.length < 1 || address.line1.length < 1 || address.city.length < 1 || address.state.length < 1) {
    return { error: "Enter the name, street, city, and state." };
  }
  if (!/^[0-9+ -]{8,20}$/.test(address.phone)) return { error: "Enter a phone number." };
  if (!/^[1-9][0-9]{5}$/.test(address.postal_code)) return { error: "Enter a 6-digit PIN code." };
  const inserted = await supabase.from("addresses").insert(address);
  if (inserted.error) return { error: "The address could not be saved." };
  return { message: "Address saved." };
}

export async function placeOrderAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServer();
  const profile = await getCatalogueProfile();
  if (!supabase || !profile) return { error: "Sign in to place an order." };
  const addressId = String(form.get("addressId") ?? "");
  let items: unknown;
  try {
    items = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    return { error: "The bag could not be read." };
  }
  if (!Array.isArray(items) || items.length === 0) return { error: "Your bag is empty." };
  const payload = items.map((item) => {
    const row = item as { variantId?: string; quantity?: number };
    return { variant_id: row.variantId, quantity: row.quantity };
  });
  const placed = await supabase.rpc("place_order", { p_items: payload, p_address_id: addressId });
  if (placed.error) return { error: placed.error.message || "The order could not be placed." };
  revalidatePath("/account/orders");
  return { message: `Order ${placed.data} is pending. Payment has not been taken.` };
}

export async function toggleWishlistAction(productId: string) {
  const supabase = await createSupabaseServer();
  const profile = await getCatalogueProfile();
  if (!supabase || !profile) return { ok: false as const, message: "Sign in to save a wishlist." };
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return { ok: false as const, message: "That piece cannot be saved." };
  const wishlist = await supabase.from("wishlists").select("id").eq("user_id", profile.id).maybeSingle();
  let wishlistId = (wishlist.data as { id: string } | null)?.id;
  if (!wishlistId) {
    const created = await supabase.from("wishlists").insert({ user_id: profile.id }).select("id").single();
    if (created.error || !created.data) return { ok: false as const, message: "The wishlist could not be created." };
    wishlistId = (created.data as { id: string }).id;
  }
  const existing = await supabase.from("wishlist_items").select("id").eq("wishlist_id", wishlistId).eq("product_id", productId).maybeSingle();
  if (existing.data) {
    await supabase.from("wishlist_items").delete().eq("id", (existing.data as { id: string }).id);
  } else {
    await supabase.from("wishlist_items").insert({ wishlist_id: wishlistId, product_id: productId });
  }
  revalidatePath("/wishlist");
  return { ok: true as const, message: "Wishlist updated." };
}

export async function syncCartAction(items: { variantId: string; quantity: number }[]) {
  const supabase = await createSupabaseServer();
  const profile = await getCatalogueProfile();
  if (!supabase || !profile) return;
  const cart = await supabase.from("carts").select("id").eq("user_id", profile.id).maybeSingle();
  let cartId = (cart.data as { id: string } | null)?.id;
  if (!cartId) {
    const created = await supabase.from("carts").insert({ user_id: profile.id }).select("id").single();
    if (created.error || !created.data) return;
    cartId = (created.data as { id: string }).id;
  }
  await supabase.from("cart_items").delete().eq("cart_id", cartId);
  const rows = items
    .filter((item) => /^[0-9a-f-]{36}$/i.test(item.variantId) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 5)
    .slice(0, 20)
    .map((item) => ({ cart_id: cartId, variant_id: item.variantId, quantity: item.quantity }));
  if (rows.length > 0) await supabase.from("cart_items").insert(rows);
}
