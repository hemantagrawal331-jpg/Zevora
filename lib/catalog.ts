import { getCategory, getSubcategory, isCategoryId, subcategoryLabel, type CategoryId } from "@/lib/categories";
import { products } from "@/lib/demo-products";
import { isOnSale, totalStock, type Product } from "@/lib/products";

export type SortKey = "newest" | "price-asc" | "price-desc" | "popularity";

export type CatalogFilters = {
  query: string;
  category: CategoryId | null;
  subcategory: string | null;
  sizes: string[];
  colors: string[];
  availability: "all" | "in-stock";
  minPaise: number | null;
  maxPaise: number | null;
  sort: SortKey;
  page: number;
  pageSize: number;
};

export type CatalogPage = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export const PAGE_SIZE = 12;

const sorts: SortKey[] = ["newest", "price-asc", "price-desc", "popularity"];

export function activeProducts() {
  return products.filter((product) => product.isActive);
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug && product.isActive);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id && product.isActive);
}

export function getByCategory(category: CategoryId) {
  return activeProducts().filter((product) => product.category === category);
}

export function getBySubcategory(category: CategoryId, subcategory: string) {
  return getByCategory(category).filter((product) => product.subcategory === subcategory);
}

export function getNewArrivals() {
  return activeProducts()
    .filter((product) => product.isNewArrival)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBestsellers() {
  return activeProducts()
    .filter((product) => product.isBestseller)
    .sort((a, b) => b.popularity - a.popularity);
}

export function getSaleProducts() {
  return activeProducts().filter((product) => isOnSale(product));
}

export function subcategoryParams(category: CategoryId) {
  return getCategory(category)?.subcategories.map((subcategory) => ({ subcategory: subcategory.slug })) ?? [];
}

export function emptyFilters(overrides: Partial<CatalogFilters> = {}): CatalogFilters {
  return {
    query: "",
    category: null,
    subcategory: null,
    sizes: [],
    colors: [],
    availability: "all",
    minPaise: null,
    maxPaise: null,
    sort: "newest",
    page: 1,
    pageSize: PAGE_SIZE,
    ...overrides,
  };
}

export function parseCatalogFilters(input: {
  q?: string;
  category?: string;
  subcategory?: string;
  size?: string;
  color?: string;
  availability?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
}): CatalogFilters {
  const category = input.category && isCategoryId(input.category) ? input.category : null;
  const subcategory =
    input.subcategory && category && getSubcategory(category, input.subcategory)
      ? input.subcategory
      : input.subcategory && !category
        ? input.subcategory
        : null;
  return {
    query: (input.q ?? "").trim().slice(0, 80),
    category,
    subcategory: subcategory && isKnownSubcategory(subcategory) ? subcategory : null,
    sizes: splitList(input.size),
    colors: splitList(input.color),
    availability: input.availability === "in-stock" ? "in-stock" : "all",
    minPaise: rupeesParam(input.min),
    maxPaise: rupeesParam(input.max),
    sort: sorts.includes(input.sort as SortKey) ? (input.sort as SortKey) : "newest",
    page: positiveInt(input.page, 1),
    pageSize: Math.min(48, positiveInt(undefined, PAGE_SIZE)),
  };
}

export function queryCatalog(source: Product[], filters: CatalogFilters): CatalogPage {
  const matched = source.filter((product) => matches(product, filters));
  matched.sort((a, b) => compareProducts(a, b, filters.sort));
  const pageSize = Math.min(48, Math.max(1, filters.pageSize));
  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  const page = matched.length === 0 ? 1 : Math.min(Math.max(1, filters.page), pageCount);
  const start = (page - 1) * pageSize;
  return {
    products: matched.slice(start, start + pageSize),
    total: matched.length,
    page,
    pageSize,
    pageCount,
  };
}

export function getRelated(product: Product) {
  const others = activeProducts().filter((item) => item.id !== product.id);
  const sameSubcategory = others.filter(
    (item) => item.category === product.category && item.subcategory === product.subcategory,
  );
  const sameCategory = others.filter(
    (item) => item.category === product.category && item.subcategory !== product.subcategory,
  );
  return [...sameSubcategory, ...sameCategory].slice(0, 4);
}

export function searchProducts(query: string) {
  return queryCatalog(activeProducts(), emptyFilters({ query, pageSize: 48 })).products;
}

function matches(product: Product, filters: CatalogFilters) {
  if (!product.isActive) return false;
  if (filters.category && product.category !== filters.category) return false;
  if (filters.subcategory && product.subcategory !== filters.subcategory) return false;
  if (filters.query) {
    const haystack = searchableText(product);
    const terms = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.every((term) => haystack.includes(term))) return false;
  }
  if (filters.sizes.length > 0) {
    const available = product.sizes.some((size) => {
      if (!filters.sizes.includes(size.label)) return false;
      if (filters.availability === "in-stock") return size.stockQuantity > 0;
      return true;
    });
    if (!available) return false;
  } else if (filters.availability === "in-stock" && totalStock(product) <= 0) {
    return false;
  }
  if (filters.colors.length > 0 && !product.colors.some((color) => filters.colors.includes(color.name))) {
    return false;
  }
  if (filters.minPaise !== null && product.priceInPaise < filters.minPaise) return false;
  if (filters.maxPaise !== null && product.priceInPaise > filters.maxPaise) return false;
  return true;
}

function searchableText(product: Product) {
  const subcategory = getSubcategory(product.category, product.subcategory);
  return [
    product.name,
    product.description,
    product.material,
    product.fit,
    product.category,
    getCategory(product.category)?.label ?? "",
    product.subcategory,
    subcategoryLabel(product.category, product.subcategory),
    ...(subcategory?.keywords ?? []),
    ...product.tags,
    ...product.colors.map((color) => color.name),
  ]
    .join(" ")
    .toLowerCase();
}

function compareProducts(a: Product, b: Product, sort: SortKey) {
  if (sort === "price-asc") return a.priceInPaise - b.priceInPaise || a.name.localeCompare(b.name);
  if (sort === "price-desc") return b.priceInPaise - a.priceInPaise || a.name.localeCompare(b.name);
  if (sort === "popularity") return b.popularity - a.popularity || b.createdAt.localeCompare(a.createdAt);
  return b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name);
}

function isKnownSubcategory(slug: string) {
  return getCategory("men")?.subcategories.some((item) => item.slug === slug) ||
    getCategory("women")?.subcategories.some((item) => item.slug === slug) ||
    getCategory("accessories")?.subcategories.some((item) => item.slug === slug);
}

function splitList(value: string | undefined) {
  if (!value) return [];
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 8);
}

function rupeesParam(value: string | undefined) {
  if (!value || !/^[1-9][0-9]*$/.test(value)) return null;
  const rupees = Number(value);
  if (!Number.isSafeInteger(rupees) || rupees > 1000000) return null;
  return rupees * 100;
}

function positiveInt(value: string | undefined, fallback: number) {
  if (!value || !/^[1-9][0-9]*$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}
