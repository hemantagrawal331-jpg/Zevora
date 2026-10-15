import { isCategoryId, type CategoryId } from "@/lib/categories";
import { optionalComparePaise, rupeesToPaise } from "@/lib/commerce/money";

export type VariantDraft = {
  size: string;
  color: string;
  hex: string;
  sku: string;
  priceInPaise: number;
  compareAtPriceInPaise: number | null;
  stockQuantity: number;
};

export type ProductDraft = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  department: CategoryId;
  material: string;
  fit: string;
  care: string;
  tags: string[];
  isNewArrival: boolean;
  isBestseller: boolean;
  isActive: boolean;
  variants: VariantDraft[];
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const skuPattern = /^[A-Z0-9-]{3,40}$/;

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseProductForm(form: FormData): { ok: true; draft: ProductDraft } | { ok: false; message: string } {
  const name = String(form.get("name") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? "") || name);
  const description = String(form.get("description") ?? "").trim();
  const categoryId = String(form.get("categoryId") ?? "").trim();
  const department = String(form.get("department") ?? "").trim();
  const material = String(form.get("material") ?? "").trim();
  const fit = String(form.get("fit") ?? "").trim();
  const care = String(form.get("care") ?? "").trim();
  const id = String(form.get("id") ?? "").trim();
  if (name.length < 1 || name.length > 140) return { ok: false, message: "Enter a product name." };
  if (!slugPattern.test(slug)) return { ok: false, message: "Use a lowercase slug with letters, numbers, and hyphens." };
  if (!/^[0-9a-f-]{36}$/i.test(categoryId)) return { ok: false, message: "Choose a subcategory." };
  if (!isCategoryId(department)) return { ok: false, message: "Choose Men, Women, or Accessories." };
  if (description.length > 4000 || material.length > 400 || fit.length > 200 || care.length > 400) {
    return { ok: false, message: "Shorten the description, material, fit, or care text." };
  }
  let variants: unknown;
  try {
    variants = JSON.parse(String(form.get("variants") ?? "[]"));
  } catch {
    return { ok: false, message: "Variant details could not be read." };
  }
  if (!Array.isArray(variants) || variants.length < 1 || variants.length > 40) {
    return { ok: false, message: "Add at least one size and colour variant." };
  }
  const parsed: VariantDraft[] = [];
  const seen = new Set<string>();
  for (const item of variants) {
    if (!item || typeof item !== "object") return { ok: false, message: "A variant is incomplete." };
    const row = item as Record<string, unknown>;
    const size = String(row.size ?? "").trim();
    const color = String(row.color ?? "").trim();
    const hex = String(row.hex ?? "").trim();
    const sku = String(row.sku ?? "").trim().toUpperCase();
    const price = rupeesToPaise(String(row.price ?? ""));
    const compare = optionalComparePaise(price ?? 0, String(row.compare ?? ""));
    const stock = Number(row.stock);
    if (size.length < 1 || size.length > 20 || color.length < 1 || color.length > 40) {
      return { ok: false, message: "Each variant needs a size and a colour." };
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return { ok: false, message: `Use a hex colour for ${color}.` };
    if (!skuPattern.test(sku)) return { ok: false, message: `SKU ${sku || "(blank)"} must be 3–40 letters, numbers, or hyphens.` };
    if (price === null) return { ok: false, message: `Enter a price in rupees for ${sku}.` };
    if (!compare.ok) return compare;
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
      return { ok: false, message: `Enter a whole stock quantity for ${sku}.` };
    }
    const key = `${size.toLowerCase()}|${color.toLowerCase()}`;
    if (seen.has(key) || parsed.some((variant) => variant.sku === sku)) {
      return { ok: false, message: "Sizes, colours, and SKUs must be unique for this product." };
    }
    seen.add(key);
    parsed.push({
      size,
      color,
      hex,
      sku,
      priceInPaise: price,
      compareAtPriceInPaise: compare.paise,
      stockQuantity: stock,
    });
  }
  const tags = String(form.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
  return {
    ok: true,
    draft: {
      id: /^[0-9a-f-]{36}$/i.test(id) ? id : null,
      name,
      slug,
      description,
      categoryId,
      department,
      material,
      fit,
      care,
      tags,
      isNewArrival: form.get("isNewArrival") === "on",
      isBestseller: form.get("isBestseller") === "on",
      isActive: form.get("isActive") === "on",
      variants: parsed,
    },
  };
}
