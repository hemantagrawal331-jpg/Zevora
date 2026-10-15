import type { CategoryId } from "@/lib/categories";
import { isCategoryId } from "@/lib/categories";
import { productImageUrl } from "@/lib/commerce/images";
import type { CatalogImage, Product, ProductColor, ProductVariant } from "@/lib/product-types";

export type CatalogueVariantRow = {
  id: string;
  sku: string;
  size_label: string;
  color_name: string;
  color_hex: string;
  price_in_paise: number;
  compare_at_price_in_paise: number | null;
  stock_quantity: number;
  is_active: boolean;
};

export type CatalogueImageRow = {
  storage_path: string;
  alt: string;
  color_name: string | null;
  sort_order: number;
};

export type CatalogueProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  material: string;
  fit: string;
  care: string;
  tags: string[];
  is_new_arrival: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  popularity: number;
  created_at: string;
  category: { slug: string; department: string; name: string } | { slug: string; department: string; name: string }[] | null;
  variants: CatalogueVariantRow[] | null;
  images: CatalogueImageRow[] | null;
};

function one<T>(value: T | T[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function mapCatalogueProduct(row: CatalogueProductRow): Product | null {
  const category = one(row.category);
  if (!category || !isCategoryId(category.department)) return null;
  const variants = (row.variants ?? [])
    .filter((variant) => variant.is_active)
    .map((variant) => ({
      id: variant.id,
      size: variant.size_label,
      color: variant.color_name,
      sku: variant.sku,
      stockQuantity: variant.stock_quantity,
      priceInPaise: variant.price_in_paise,
      compareAtPriceInPaise:
        variant.compare_at_price_in_paise && variant.compare_at_price_in_paise > variant.price_in_paise
          ? variant.compare_at_price_in_paise
          : undefined,
    } satisfies ProductVariant))
    .sort((a, b) => a.priceInPaise - b.priceInPaise || a.size.localeCompare(b.size));
  if (variants.length === 0) return null;
  const priced = variants[0];
  if (!priced) return null;
  const colors = uniqueColors(variants, row.variants ?? []);
  const sizes = uniqueSizes(variants);
  const images = (row.images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image, index): CatalogImage => ({
      src: productImageUrl(image.storage_path),
      alt: image.alt || row.name,
      color: image.color_name ?? undefined,
      role: index === 0 ? "main" : "alternate",
      fit: "cover",
    }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: category.department as CategoryId,
    subcategory: category.slug,
    priceInPaise: priced.priceInPaise,
    compareAtPriceInPaise: priced.compareAtPriceInPaise,
    images,
    sizes,
    colors,
    variants,
    sku: priced.sku,
    stockQuantity: variants.reduce((total, variant) => total + variant.stockQuantity, 0),
    tags: row.tags,
    material: row.material,
    fit: row.fit,
    care: row.care,
    isNewArrival: row.is_new_arrival,
    isBestseller: row.is_bestseller,
    isActive: row.is_active,
    popularity: row.popularity,
    createdAt: row.created_at,
    demo: false,
  };
}

function uniqueColors(active: ProductVariant[], rows: CatalogueVariantRow[]): ProductColor[] {
  const seen = new Map<string, string>();
  for (const variant of active) {
    const hex = rows.find((row) => row.id === variant.id)?.color_hex ?? "#171717";
    if (!seen.has(variant.color)) seen.set(variant.color, hex);
  }
  return [...seen.entries()].map(([name, hex]) => ({ name, hex }));
}

function uniqueSizes(variants: ProductVariant[]) {
  const seen = new Map<string, { sku: string; stockQuantity: number }>();
  for (const variant of variants) {
    const current = seen.get(variant.size);
    if (!current) seen.set(variant.size, { sku: variant.sku, stockQuantity: variant.stockQuantity });
    else current.stockQuantity += variant.stockQuantity;
  }
  return [...seen.entries()].map(([label, value]) => ({ label, ...value }));
}
