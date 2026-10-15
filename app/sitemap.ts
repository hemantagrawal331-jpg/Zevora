import type { MetadataRoute } from "next";
import { categories } from "@/lib/categories";
import { loadStorefront } from "@/lib/commerce/catalogue";
import { siteUrl } from "@/lib/site";

const pages = ["", "/shop", "/new-arrivals", "/sale", "/bestsellers", "/about", "/contact", "/support", "/shipping", "/returns", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const loaded = await loadStorefront();
  const staticUrls = [
    ...pages.map((path) => `${origin}${path || "/"}`),
    ...categories.flatMap((category) => [
      `${origin}${category.href}`,
      ...category.subcategories.map((subcategory) => `${origin}${category.href}/${subcategory.slug}`),
    ]),
  ];
  const productUrls = loaded.error
    ? []
    : loaded.products.map((product) => ({
        url: `${origin}/product/${product.slug}`,
        lastModified: product.createdAt,
      }));
  return [
    ...staticUrls.map((url) => ({ url })),
    ...productUrls,
  ];
}
