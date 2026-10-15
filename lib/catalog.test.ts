import assert from "node:assert/strict";
import { test } from "node:test";
import { decideBagQuantity } from "./bag-rules";
import { categories, getSubcategory } from "./categories";
import {
  activeProducts,
  emptyFilters,
  getProduct,
  queryCatalog,
  searchProducts,
} from "./catalog";
import { checkDeliveryPin } from "./delivery";
import { formatPrice } from "./format";
import { isNavCurrent, navigation } from "./navigation";
import { products, isOnSale, sizeStock } from "./products";

const required = {
  men: [
    "Denim jeans",
    "Hoodies",
    "Sweatshirts",
    "Joggers and lowers",
    "Gymwear and activewear",
    "T-shirts",
    "Shirts",
    "Jackets",
    "Cargo pants",
    "Shorts",
  ],
  women: [
    "Crop tops",
    "Tops and T-shirts",
    "Hoodies",
    "Jeans",
    "Denim",
    "Skirts",
    "Shorts",
    "Dresses",
    "Jackets",
    "Co-ord sets",
  ],
  accessories: [
    "Wallets",
    "Belts",
    "Perfumes",
    "Caps",
    "Sunglasses",
    "Bags",
    "Fashion jewellery",
    "Other fashion essentials",
  ],
} as const;

test("categories stay configurable and cover the three departments", () => {
  assert.deepEqual(
    categories.map((category) => category.id),
    ["men", "women", "accessories"],
  );
  for (const category of categories) {
    assert.deepEqual(
      category.subcategories.map((subcategory) => subcategory.label),
      [...required[category.id]],
    );
    for (const subcategory of category.subcategories) {
      assert.equal(getSubcategory(category.id, subcategory.slug)?.label, subcategory.label);
      assert.ok(
        activeProducts().some(
          (product) => product.category === category.id && product.subcategory === subcategory.slug,
        ),
      );
    }
  }
});

test("search, filters, and sorting change the same result set", () => {
  const hoodies = searchProducts("hoodie");
  assert.ok(hoodies.length >= 2);
  assert.ok(hoodies.every((product) => product.tags.join(" ").toLowerCase().includes("hoodie") || product.name.toLowerCase().includes("hoodie")));

  const filtered = queryCatalog(
    activeProducts(),
    emptyFilters({
      category: "men",
      sizes: ["M"],
      availability: "in-stock",
      sort: "price-asc",
    }),
  );
  assert.ok(filtered.total > 1);
  assert.ok(filtered.products.every((product) => product.category === "men"));
  assert.ok(filtered.products.every((product) => sizeStock(product, "M") > 0));
  const prices = filtered.products.map((product) => product.priceInPaise);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));

  const hidden = queryCatalog(
    activeProducts(),
    emptyFilters({ category: "men", subcategory: "shorts", availability: "in-stock" }),
  );
  assert.equal(hidden.total, 0);
  const visible = queryCatalog(activeProducts(), emptyFilters({ category: "men", subcategory: "shorts" }));
  assert.equal(visible.total, 1);
  assert.equal(visible.products[0]?.stockQuantity, 0);
});

test("product pages resolve by slug and keep unavailable variants out of the bag", () => {
  const coat = getProduct("camel-wool-coat");
  assert.equal(coat?.priceInPaise, 1890000);
  assert.equal(coat?.demo, true);
  assert.equal(getProduct("missing-piece"), undefined);
  assert.equal(getProduct("withdrawn-sample"), undefined);
  assert.equal(activeProducts().some((product) => product.id === "withdrawn-sample"), false);

  const navy = getProduct("navy-tailored-jacket");
  assert.ok(navy);
  assert.equal(sizeStock(navy, "XL"), 0);
  assert.equal(isOnSale(navy), true);
  assert.deepEqual(decideBagQuantity({ stock: sizeStock(navy, "XL"), already: 0, requested: 1 }), {
    ok: false,
    message: "This selection is out of stock.",
  });
  assert.equal(decideBagQuantity({ stock: sizeStock(navy, "M"), already: 0, requested: 1 }).ok, true);

  const page = queryCatalog(activeProducts(), emptyFilters({ page: 2, pageSize: 12 }));
  assert.equal(page.page, 2);
  assert.ok(page.products.length > 0);
  assert.ok(page.total > 12);
});

test("formats paise as rupees and checks a PIN without calling the network", async () => {
  const formatted = formatPrice(99900);
  assert.match(formatted, /999/);
  assert.equal(formatted.includes("99900"), false);
  assert.equal(formatPrice(1890000).includes("18,900") || formatPrice(1890000).includes("18900"), true);

  let calls = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    calls += 1;
    throw new Error("fetch");
  }) as typeof fetch;
  try {
    assert.equal((await checkDeliveryPin("400050")).source, "unconfigured");
    assert.equal((await checkDeliveryPin("400050")).serviceable, null);
    assert.match((await checkDeliveryPin("12")).message, /6-digit/);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("navigation links point at shop, departments, and categories", () => {
  const hrefs = navigation.flatMap((item) => [item.href, item.feature.href, ...item.columns.flatMap((column) => column.links.map((link) => link.href))]);
  assert.ok(hrefs.includes("/shop"));
  assert.ok(hrefs.includes("/men"));
  assert.ok(hrefs.includes("/women"));
  assert.ok(hrefs.includes("/accessories"));
  assert.ok(hrefs.includes("/new-arrivals"));
  assert.ok(hrefs.includes("/sale"));
  for (const href of hrefs) {
    const path = href.split("?")[0] ?? href;
    assert.match(path, /^\/(shop|new-arrivals|sale|men|women|accessories)(\/|$)/);
  }
  for (const product of products.filter((product) => product.isActive)) {
    assert.ok(getSubcategory(product.category, product.subcategory));
  }
  assert.equal(isNavCurrent("/men", "/men/jackets"), true);
  assert.equal(isNavCurrent("/shop", "/men"), false);
  assert.equal(products.every((product) => product.demo), true);
});
