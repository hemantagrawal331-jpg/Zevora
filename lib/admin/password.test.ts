import assert from "node:assert/strict";
import { test } from "node:test";
import { emailsMatch, hashPassword, isPasswordHash, verifyPassword } from "./password";

test("hashes and checks an admin password without echoing it", async () => {
  const password = "correct horse battery";
  const hash = await hashPassword(password);
  assert.equal(isPasswordHash(hash), true);
  assert.equal(hash.includes(password), false);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("wrong horse battery", hash), false);
  assert.equal(await verifyPassword(password, "not-a-hash"), false);
  assert.equal(emailsMatch("Admin@Zevora.in", "admin@zevora.in"), true);
  assert.equal(emailsMatch("admin@zevora.in", "other@zevora.in"), false);
  await assert.rejects(() => hashPassword("too-short"));
});
