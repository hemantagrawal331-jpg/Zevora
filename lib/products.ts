import { subcategoryLabel } from "@/lib/categories";
import { products } from "@/lib/demo-products";
import { images } from "@/lib/images";
import type { CatalogImage, Product } from "@/lib/product-types";

export type { CatalogImage, Product, ProductColor, ProductSize, ProductVariant } from "@/lib/product-types";
export { products };

export function isOnSale(product: Product) {
  return (
    product.compareAtPriceInPaise !== undefined &&
    product.compareAtPriceInPaise > product.priceInPaise
  );
}

export function totalStock(product: Product) {
  if (product.variants.length > 0) {
    return product.variants.reduce((total, variant) => total + variant.stockQuantity, 0);
  }
  return product.sizes.reduce((total, size) => total + size.stockQuantity, 0);
}

export function sizeStock(product: Product, size: string | null, color?: string | null) {
  if (!size) return 0;
  if (product.variants.length > 0) {
    return product.variants
      .filter((variant) => variant.size === size && (!color || variant.color === color))
      .reduce((total, variant) => total + variant.stockQuantity, 0);
  }
  return product.sizes.find((item) => item.label === size)?.stockQuantity ?? 0;
}

export function findVariant(product: Product, size: string | null, color?: string | null) {
  if (!size || product.variants.length === 0) return undefined;
  return product.variants.find((variant) => variant.size === size && (!color || variant.color === color));
}

export function imagesFor(product: Product, color?: string): CatalogImage[] {
  const matching = color ? product.images.filter((image) => image.color === color) : [];
  const list = matching.length > 0 ? matching : product.images;
  if (list.length > 0) return list;
  return [
    {
      src: images.productFallback,
      alt: `Demo photograph pending for ${product.name}`,
      role: "main",
      fit: "contain",
    },
  ];
}

export function mainImage(product: Product, color?: string) {
  const list = imagesFor(product, color);
  return list.find((image) => image.role === "main") ?? list[0];
}

export function photographedColor(product: Product) {
  return product.images.find((image) => image.role === "main" && image.color)?.color ?? "";
}

export function productLabel(product: Product) {
  return subcategoryLabel(product.category, product.subcategory);
}
