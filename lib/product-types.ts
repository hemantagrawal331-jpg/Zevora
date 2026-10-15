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
  demo: true;
};
