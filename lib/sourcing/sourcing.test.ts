import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminActor } from "../admin/actor";
import { products } from "../products";
import { sourcingCategories } from "./categories";
import { UnauthorizedError, ValidationError } from "./errors";
import { createMemoryRepository } from "./memory";
import type { SourcingRepository } from "./repository";
import { createSourcingService } from "./service";
import type { SourcingDraft, SourcingQuery } from "./types";
import { draftFromForm, escapeLike, normalizeMeeshoUrl, parseSourcingDraft, parseSourcingQuery } from "./validation";

const admin: AdminActor = { email: "admin@zevora.in", role: "admin" };

function draft(overrides: Partial<SourcingDraft> = {}): SourcingDraft {
  return {
    referenceName: "Indigo shirt",
    meeshoUrl: "https://www.meesho.com/indigo-shirt/p/abc",
    referenceBrand: "Reference",
    department: "MEN",
    subcategory: "Shirts",
    referencePrice: "1299",
    lastCheckedOn: "2026-10-15",
    supplierName: "Northloom",
    supplierContact: "riya@northloom.example",
    supplierReference: "Quote 14",
    wholesaleCost: "480",
    minimumOrderQuantity: "12",
    deliveryTime: "10 days",
    resaleAuthorization: "NOT_PROVIDED",
    authenticityStatus: "NOT_PROVIDED",
    imagePermission: "NOT_PROVIDED",
    documentationReference: "INV-14",
    internalNotes: "Check the stitch.",
    ...overrides,
  };
}

function listing(overrides: Partial<SourcingQuery> = {}): SourcingQuery {
  return {
    query: "",
    department: null,
    subcategory: null,
    status: null,
    includeArchived: false,
    page: 1,
    pageSize: 20,
    ...overrides,
  };
}

function blockedRepository(): SourcingRepository & { called: boolean } {
  const repo = {
    called: false,
    async insert() {
      repo.called = true;
    },
    async update() {
      repo.called = true;
    },
    async findById() {
      repo.called = true;
      return null;
    },
    async search() {
      repo.called = true;
      return { records: [], total: 0, page: 1, pageSize: 20 };
    },
  };
  return repo;
}

test("keeps the intended sourcing categories", () => {
  assert.deepEqual(sourcingCategories.MEN, [
    "Denim",
    "Jeans",
    "Hoodies",
    "Lowers",
    "Sweatshirts",
    "Gymwear",
    "T-shirts",
    "Shirts",
    "Cargos",
    "Shorts",
    "Jackets",
  ]);
  assert.deepEqual(sourcingCategories.WOMEN, [
    "Crop tops",
    "Jeans",
    "Denim",
    "Skirts",
    "Shorts",
    "Hoodies",
    "Tops",
    "Dresses",
    "Jackets",
    "Co-ord sets",
  ]);
  assert.deepEqual(sourcingCategories.ACCESSORIES, [
    "Wallets",
    "Belts",
    "Perfumes",
    "Caps",
    "Sunglasses",
    "Bags",
    "Fashion accessories",
  ]);
});

test("validates Meesho URLs without fetching them", async () => {
  let calls = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    calls += 1;
    throw new Error("fetch");
  }) as typeof fetch;
  try {
    assert.equal(
      normalizeMeeshoUrl("https://www.meesho.com/indigo-shirt/p/abc#reviews"),
      "https://www.meesho.com/indigo-shirt/p/abc",
    );
    assert.equal(
      normalizeMeeshoUrl("  https://meesho.com/indigo-shirt/p/abc?ref=1  "),
      "https://meesho.com/indigo-shirt/p/abc?ref=1",
    );
    for (const value of [
      "http://www.meesho.com/indigo-shirt/p/abc",
      "https://www.meesho.com/",
      "https://meesho.com",
      "https://user:pass@www.meesho.com/indigo-shirt/p/abc",
      "https://evil.com/www.meesho.com/p/abc",
      "https://meesho.com.evil.com/p/abc",
      "javascript:alert(1)",
      "data:text/html,hello",
    ]) {
      assert.equal(normalizeMeeshoUrl(value), null);
    }
    const service = createSourcingService(createMemoryRepository());
    const record = await service.create(admin, draft());
    assert.equal(record.meeshoUrl, "https://www.meesho.com/indigo-shirt/p/abc");
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("rejects a sourcing record that is not a Meesho product URL", async () => {
  const service = createSourcingService(createMemoryRepository());
  await assert.rejects(() => service.create(admin, draft({ meeshoUrl: "https://example.com/p/1" })), ValidationError);
  await assert.rejects(() => service.create(admin, draft({ referencePrice: "1,299" })), (error: unknown) => {
    assert.ok(error instanceof ValidationError);
    assert.match(error.fieldErrors.referencePrice ?? "", /whole rupee/);
    return true;
  });
  await assert.rejects(
    () => service.create(admin, draft({ department: "WOMEN", subcategory: "Lowers" })),
    ValidationError,
  );
  assert.equal((await service.search(admin, listing())).total, 0);
});

test("creates, edits, searches, and archives a private sourcing record", async () => {
  const before = products.length;
  const service = createSourcingService(createMemoryRepository());
  const created = await service.create(admin, draft());
  assert.equal(created.workflowStatus, "SHORTLISTED");
  assert.equal(created.referencePriceUnverified, true);
  assert.equal(created.supplierContact, "riya@northloom.example");

  const updated = await service.update(
    admin,
    created.id,
    draft({ referenceName: "Checked shirt", referencePrice: "1500", internalNotes: "Rechecked hem." }),
  );
  assert.equal(updated.referenceName, "Checked shirt");
  assert.equal(updated.referencePriceInr, 1500);
  assert.equal(updated.referencePriceUnverified, true);
  assert.equal(updated.workflowStatus, "SHORTLISTED");
  assert.equal((await service.search(admin, listing({ query: "Checked shirt" }))).total, 1);
  assert.equal((await service.search(admin, listing({ query: "Northloom" }))).total, 1);
  assert.equal((await service.search(admin, listing({ query: "Rechecked hem" }))).total, 1);
  assert.equal((await service.search(admin, listing({ query: "Indigo shirt" }))).total, 0);
  assert.equal((await service.search(admin, listing({ query: "riya@northloom.example" }))).total, 0);
  assert.equal((await service.search(admin, listing({ query: "%" }))).total, 0);

  await assert.rejects(() => service.transition(admin, created.id, "READY_TO_PUBLISH"), ValidationError);
  assert.equal((await service.get(admin, created.id))?.workflowStatus, "SHORTLISTED");

  await service.transition(admin, created.id, "SUPPLIER_IDENTIFIED");
  await service.transition(admin, created.id, "VERIFICATION_PENDING");
  await assert.rejects(() => service.transition(admin, created.id, "APPROVED_FOR_SOURCING"), ValidationError);
  await service.update(admin, created.id, draft({
    referenceName: "Checked shirt",
    resaleAuthorization: "GRANTED",
    authenticityStatus: "DENIED",
    internalNotes: "Rechecked hem.",
  }));
  await assert.rejects(() => service.transition(admin, created.id, "APPROVED_FOR_SOURCING"), ValidationError);
  await service.update(admin, created.id, draft({
    referenceName: "Checked shirt",
    resaleAuthorization: "GRANTED",
    authenticityStatus: "GRANTED",
    imagePermission: "PENDING",
    internalNotes: "Rechecked hem.",
  }));
  await service.transition(admin, created.id, "APPROVED_FOR_SOURCING");
  await service.transition(admin, created.id, "STOCK_VERIFIED");
  await assert.rejects(() => service.transition(admin, created.id, "READY_TO_PUBLISH"), ValidationError);
  await service.update(admin, created.id, draft({
    referenceName: "Checked shirt",
    resaleAuthorization: "GRANTED",
    authenticityStatus: "GRANTED",
    imagePermission: "GRANTED",
    internalNotes: "Rechecked hem.",
  }));
  const ready = await service.transition(admin, created.id, "READY_TO_PUBLISH");
  assert.equal(ready.workflowStatus, "READY_TO_PUBLISH");
  assert.equal(products.length, before);

  const archived = await service.transition(admin, created.id, "ARCHIVED");
  assert.equal(archived.workflowStatus, "ARCHIVED");
  assert.equal(archived.archivedFromStatus, "READY_TO_PUBLISH");
  assert.equal((await service.search(admin, listing())).total, 0);
  assert.equal((await service.search(admin, listing({ includeArchived: true }))).total, 1);
  assert.equal((await service.search(admin, listing({ status: "ARCHIVED", includeArchived: false }))).total, 1);
  assert.equal(products.length, before);
});

test("paginates sourcing records and clamps the page size", async () => {
  const service = createSourcingService(createMemoryRepository());
  for (let index = 0; index < 21; index += 1) {
    await service.create(admin, draft({ referenceName: `Piece ${String(index).padStart(2, "0")}` }));
  }
  const first = await service.search(admin, listing({ page: 1, pageSize: 20 }));
  const second = await service.search(admin, listing({ page: 2, pageSize: 20 }));
  assert.equal(first.total, 21);
  assert.equal(first.records.length, 20);
  assert.equal(second.records.length, 1);
  const wide = await service.search(admin, listing({ pageSize: 100, page: 0 }));
  assert.equal(wide.pageSize, 50);
  assert.equal(wide.page, 1);
});

test("rejects an actor who is not an administrator before touching storage", async () => {
  const repo = blockedRepository();
  const service = createSourcingService(repo);
  const stranger = { email: "guest@example.com", role: "staff" } as unknown as AdminActor;
  await assert.rejects(() => service.create(null, draft()), UnauthorizedError);
  await assert.rejects(() => service.update(stranger, crypto.randomUUID(), draft()), UnauthorizedError);
  await assert.rejects(() => service.search(null, listing()), UnauthorizedError);
  await assert.rejects(() => service.get(null, crypto.randomUUID()), UnauthorizedError);
  await assert.rejects(() => service.transition(null, crypto.randomUUID(), "ARCHIVED"), UnauthorizedError);
  assert.equal(repo.called, false);
});

test("reads sourcing fields from a form and escapes search wildcards", () => {
  const form = new FormData();
  form.set("referenceName", " Indigo shirt ");
  form.set("meeshoUrl", "https://www.meesho.com/indigo-shirt/p/abc");
  form.set("department", "MEN");
  form.set("subcategory", "Shirts");
  const parsed = parseSourcingDraft(draftFromForm(form));
  assert.equal(parsed.referenceName, "Indigo shirt");
  assert.equal(parsed.referencePriceUnverified, true);
  assert.equal(parsed.supplierContact, null);
  assert.equal(escapeLike("100%_cotton\\"), "100\\%\\_cotton\\\\");
  const query = parseSourcingQuery({
    q: " shirt ",
    department: "NOPE",
    status: "ARCHIVED",
    page: "2",
    pageSize: "500",
  });
  assert.equal(query.query, "shirt");
  assert.equal(query.department, null);
  assert.equal(query.status, "ARCHIVED");
  assert.equal(query.includeArchived, true);
  assert.equal(query.page, 2);
  assert.equal(query.pageSize, 50);
});
