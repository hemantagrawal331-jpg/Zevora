import type { Metadata } from "next";
import type { Product } from "@/lib/product-types";

export function publicPage(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
  };
}

export function productStructuredData(product: Product, url: string) {
  const images = product.images.map((image) => image.src).filter((src) => src.startsWith("http") || src.startsWith("/"));
  const available = !product.demo && product.stockQuantity > 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    ...(images.length > 0 ? { image: images } : {}),
    brand: { "@type": "Brand", name: "ZEVORA" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: (product.priceInPaise / 100).toFixed(2),
      availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

export function structuredDataJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
