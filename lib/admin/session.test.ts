import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionToken, readSessionToken, safeNext, signSession } from "./session";

test("accepts a signed admin session and rejects expiry, tampering, and other roles", async () => {
  const previous = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "a".repeat(32);
  try {
    const now = Date.parse("2026-10-15T00:00:00Z");
    const token = await createSessionToken("Admin@Zevora.in", now);
    const session = await readSessionToken(token, now + 1000);
    assert.equal(session?.sub, "admin@zevora.in");
    assert.equal(session?.role, "admin");

    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    assert.equal(await readSessionToken(tampered, now + 1000), null);
    assert.equal(await readSessionToken(token, now + 13 * 60 * 60 * 1000), null);

    process.env.ADMIN_SESSION_SECRET = "b".repeat(32);
    assert.equal(await readSessionToken(token, now + 1000), null);

    process.env.ADMIN_SESSION_SECRET = "a".repeat(32);
    const staff = await signSession({ sub: "admin@zevora.in", role: "staff", exp: now + 60_000 });
    assert.equal(await readSessionToken(staff, now), null);
    assert.equal(await readSessionToken(undefined, now), null);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previous;
  }
});

test("only allows a return path inside sourcing", () => {
  assert.equal(safeNext("/admin/sourcing"), "/admin/sourcing");
  assert.equal(safeNext("/admin/sourcing/new?notice=created"), "/admin/sourcing/new?notice=created");
  assert.equal(safeNext("/admin/sourcing?q=co..ord"), "/admin/sourcing?q=co..ord");
  assert.equal(safeNext("https://evil.example/admin/sourcing"), "/admin/sourcing");
  assert.equal(safeNext("//evil.example/admin/sourcing"), "/admin/sourcing");
  assert.equal(safeNext("/admin/login"), "/admin/sourcing");
  assert.equal(safeNext("/admin/sourcing/../login"), "/admin/sourcing");
  assert.equal(safeNext("/admin/sourcing/%2e%2e/login"), "/admin/sourcing");
  assert.equal(safeNext("/%2f%2fevil.example"), "/admin/sourcing");
});
