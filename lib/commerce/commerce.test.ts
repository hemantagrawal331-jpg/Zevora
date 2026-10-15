import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogueAccess, safeCustomerNext } from "./access";
import { isSafeImagePath, validateProductImage } from "./images";
import { mapCatalogueProduct } from "./map-product";
import { rupeesToPaise } from "./money";
import { parsePaymentEvent, signPaymentBody, paymentSignaturesMatch } from "./payments";
import { parseProductForm } from "./product-input";
import { splitSql } from "../sql/split";

test("money is stored as integer paise and roles are not taken from a caller flag", () => {
  assert.equal(rupeesToPaise("999"), 99900);
  assert.equal(rupeesToPaise("999.5"), 99950);
  assert.equal(rupeesToPaise("12.345"), null);
  assert.equal(catalogueAccess({ id: "1", email: "a@b.co", fullName: "A", role: "customer" }).ok, false);
  assert.equal(catalogueAccess({ id: "1", email: "a@b.co", fullName: "A", role: "admin" }).ok, true);
  assert.equal(safeCustomerNext("https://evil.example"), "/account");
  assert.equal(safeCustomerNext("/admin/products/new"), "/admin/products/new");
});

test("product images are limited to safe types, sizes, and paths", () => {
  assert.equal(validateProductImage({ type: "image/svg+xml", size: 100 }).ok, false);
  assert.equal(validateProductImage({ type: "image/jpeg", size: 5 * 1024 * 1024 + 1 }).ok, false);
  assert.equal(validateProductImage({ type: "image/webp", size: 1024 }).ok, true);
  const productId = "11111111-1111-4111-8111-111111111111";
  assert.equal(isSafeImagePath(productId, `products/${productId}/22222222-2222-4222-8222-222222222222.jpg`), true);
  assert.equal(isSafeImagePath(productId, "../secret.jpg"), false);
});

test("catalogue rows become shop products with variant prices in paise", () => {
  const product = mapCatalogueProduct({
    id: "11111111-1111-4111-8111-111111111111",
    slug: "indigo-jean",
    name: "Indigo Jean",
    description: "A jean.",
    material: "Denim",
    fit: "Straight",
    care: "Cold wash",
    tags: ["denim"],
    is_new_arrival: true,
    is_bestseller: false,
    is_active: true,
    popularity: 10,
    created_at: "2026-10-01T00:00:00.000Z",
    category: { slug: "denim-jeans", department: "men", name: "Denim jeans" },
    variants: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        sku: "ZEV-JEAN-32",
        size_label: "32",
        color_name: "Indigo",
        color_hex: "#1E2A44",
        price_in_paise: 249900,
        compare_at_price_in_paise: 299900,
        stock_quantity: 4,
        is_active: true,
      },
    ],
    images: [{ storage_path: "products/11111111-1111-4111-8111-111111111111/photo.jpg", alt: "Jean", color_name: "Indigo", sort_order: 0 }],
  });
  assert.equal(product?.demo, false);
  assert.equal(product?.priceInPaise, 249900);
  assert.equal(product?.compareAtPriceInPaise, 299900);
  assert.equal(product?.variants[0]?.sku, "ZEV-JEAN-32");
  assert.equal(product?.category, "men");
});

test("product form rejects incomplete variants and keeps a price snapshot shape", () => {
  const form = new FormData();
  form.set("name", "Studio Shirt");
  form.set("slug", "studio-shirt");
  form.set("department", "men");
  form.set("categoryId", "33333333-3333-4333-8333-333333333333");
  form.set("isActive", "on");
  form.set(
    "variants",
    JSON.stringify([{ size: "M", color: "White", hex: "#F8F7F4", sku: "ZEV-SHIRT-M", price: "1999", compare: "2499", stock: "3" }]),
  );
  const parsed = parseProductForm(form);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.draft.variants[0]?.priceInPaise, 199900);
    assert.equal(parsed.draft.variants[0]?.compareAtPriceInPaise, 249900);
  }
});

test("payment events require a signature and reject duplicates by event id", async () => {
  const body = JSON.stringify({
    provider: "razorpay",
    eventId: "evt_123456",
    orderId: "44444444-4444-4444-8444-444444444444",
    status: "captured",
    amountInPaise: 199900,
  });
  const secret = "test-secret";
  const signature = await signPaymentBody(secret, body);
  assert.equal(await paymentSignaturesMatch(secret, body, signature), true);
  assert.equal(await paymentSignaturesMatch("", body, signature), false);
  assert.equal(parsePaymentEvent(body).ok, true);
  const duplicateKey = `${"razorpay"}:${"evt_123456"}`;
  const seen = new Set<string>();
  assert.equal(seen.has(duplicateKey), false);
  seen.add(duplicateKey);
  assert.equal(seen.has(duplicateKey), true);
  assert.equal(parsePaymentEvent(JSON.stringify({ provider: "unconfigured", eventId: "evt_123456", orderId: "44444444-4444-4444-8444-444444444444", status: "captured", amountInPaise: 1 })).ok, false);
});

test("sql migrations keep function bodies intact", () => {
  const statements = splitSql("create table a (id int);\ncreate function b() returns void as $$\nbegin\n  perform 1;\nend;\n$$;");
  assert.equal(statements.length, 2);
  assert.match(statements[1] ?? "", /perform 1/);
});
