import type { CategoryId } from "@/lib/categories";

export type ProductColor = {
  name: string;
  hex: string;
};

export type ProductSize = {
  label: string;
  sku: string;
  stockQuantity: number;
};

export type ProductVariant = {
  id: string;
  size: string;
  color: string;
  sku: string;
  stockQuantity: number;
  priceInPaise: number;
  compareAtPriceInPaise?: number;
};

export type CatalogImage = {
  src: string;
  alt: string;
  color?: string;
  role: "main" | "alternate";
  fit?: "cover" | "contain";
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  subcategory: string;
  priceInPaise: number;
  compareAtPriceInPaise?: number;
  images: CatalogImage[];
  sizes: ProductSize[];
  colors: ProductColor[];
  variants: ProductVariant[];
  sku: string;
  stockQuantity: number;
  tags: string[];
  material: string;
  fit: string;
  care: string;
  isNewArrival: boolean;
  isBestseller: boolean;
  isActive: boolean;
  popularity: number;
  createdAt: string;
  demo: boolean;
};
