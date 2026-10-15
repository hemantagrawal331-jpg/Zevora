import assert from "node:assert/strict";
import test from "node:test";
import { productStructuredData, structuredDataJson } from "@/lib/seo";
import { rateLimit } from "@/lib/security/rate-limit";
import type { Product } from "@/lib/product-types";

const product = {
  id: "1",
  slug: "camel-wool-coat",
  name: "Camel wool coat",
  description: "A wool coat.",
  category: "women",
  subcategory: "jackets",
  priceInPaise: 189900,
  images: [{ src: "/images/coat.jpg", alt: "Camel wool coat, front", role: "main" }],
  sizes: [],
  colors: [],
  variants: [],
  sku: "ZV-COAT",
  stockQuantity: 4,
  tags: [],
  material: "Wool",
  fit: "Relaxed",
  care: "Dry clean",
  isNewArrival: false,
  isBestseller: false,
  isActive: true,
  popularity: 1,
  createdAt: "2026-01-01",
  demo: true,
} satisfies Product;

test("product structured data uses the selling price and does not invent availability", () => {
  const data = productStructuredData(product, "https://example.com/product/camel-wool-coat");
  assert.equal(data.offers.price, "1899.00");
  assert.equal(data.offers.priceCurrency, "INR");
  assert.equal(data.offers.availability, "https://schema.org/OutOfStock");
  assert.equal("aggregateRating" in data, false);
  const live = productStructuredData({ ...product, demo: false }, "https://example.com/product/camel-wool-coat");
  assert.equal(live.offers.availability, "https://schema.org/InStock");
  assert.equal(structuredDataJson({ name: "</script>" }).includes("<"), false);
});

test("rate limit blocks the next request after the window is full", () => {
  const key = "test-limit";
  assert.equal(rateLimit(key, 2, 10_000, 1_000).ok, true);
  assert.equal(rateLimit(key, 2, 10_000, 1_100).ok, true);
  const blocked = rateLimit(key, 2, 10_000, 1_200);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.ok(blocked.retryAfter >= 1);
  assert.equal(rateLimit(key, 2, 10_000, 12_000).ok, true);
});
