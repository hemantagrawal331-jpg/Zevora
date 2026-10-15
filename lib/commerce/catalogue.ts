import { createClient } from "@supabase/supabase-js";
import { activeProducts, getProduct } from "@/lib/catalog";
import { mapCatalogueProduct, type CatalogueProductRow } from "@/lib/commerce/map-product";
import type { CategoryId } from "@/lib/categories";
import { navigation, navigationFromCategories, type NavItem } from "@/lib/navigation";
import type { Product } from "@/lib/products";
import { isSupabaseConfigured, publicSupabaseConfig } from "@/lib/supabase/config";

const productSelect = `
  id, slug, name, description, material, fit, care, tags,
  is_new_arrival, is_bestseller, is_active, popularity, created_at,
  category:categories!inner(slug, department, name),
  variants:product_variants(id, sku, size_label, color_name, color_hex, price_in_paise, compare_at_price_in_paise, stock_quantity, is_active),
  images:product_images(storage_path, alt, color_name, sort_order)
`;

export type StorefrontLoad = {
  source: "demo" | "database";
  products: Product[];
  notice: string | null;
  error: string | null;
};

function publicClient() {
  const config = publicSupabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function loadStorefront(): Promise<StorefrontLoad> {
  if (!isSupabaseConfigured()) {
    return {
      source: "demo",
      products: activeProducts(),
      notice: "Supabase is not configured, so this page is showing the sample catalogue.",
      error: null,
    };
  }
  const supabase = publicClient();
  if (!supabase) {
    return { source: "database", products: [], notice: null, error: "Supabase credentials are incomplete." };
  }
  const { data, error } = await supabase.from("products").select(productSelect).eq("is_active", true);
  if (error) {
    console.error("Catalogue read failed.", error.code);
    return {
      source: "database",
      products: [],
      notice: null,
      error: "The product database could not be read. Sample products were not substituted.",
    };
  }
  const products = ((data ?? []) as CatalogueProductRow[])
    .map((row) => mapCatalogueProduct(row))
    .filter((product): product is Product => product !== null);
  return { source: "database", products, notice: null, error: null };
}

export async function loadProductBySlug(slug: string) {
  if (!isSupabaseConfigured()) return getProduct(slug) ?? null;
  const loaded = await loadStorefront();
  if (loaded.error) return null;
  return loaded.products.find((product) => product.slug === slug) ?? null;
}

export async function subcategoryIsKnown(category: CategoryId, slug: string) {
  const { getSubcategory } = await import("@/lib/categories");
  if (getSubcategory(category, slug)) return true;
  if (!isSupabaseConfigured()) return false;
  const supabase = publicClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("department", category)
    .eq("slug", slug)
    .not("parent_id", "is", null)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
}

export async function loadNavigationItems(): Promise<NavItem[]> {
  if (!isSupabaseConfigured()) return navigation;
  const supabase = publicClient();
  if (!supabase) return navigation;
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, department, parent_id, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error || !data) return navigation;
  const rows = data as { slug: string; name: string; department: string; parent_id: string | null; sort_order: number }[];
  const departments = rows.filter((row) => row.parent_id === null);
  const groups = departments
    .filter((row): row is typeof row & { department: CategoryId } =>
      row.department === "men" || row.department === "women" || row.department === "accessories",
    )
    .map((department) => ({
      id: department.department,
      label: department.name,
      href: `/${department.slug}`,
      subcategories: rows
        .filter((row) => row.parent_id !== null && row.department === department.department)
        .map((row) => ({ slug: row.slug, label: row.name })),
    }));
  return groups.length > 0 ? navigationFromCategories(groups) : navigation;
}
