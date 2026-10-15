import { hashPassword } from "../lib/admin/password";

const password = process.env.ADMIN_PASSWORD ?? "";
if (password.length < 12) {
  console.error("Set ADMIN_PASSWORD to at least 12 characters. No hash was printed.");
  process.exit(1);
}

const hash = await hashPassword(password);
process.stdout.write(`${hash}\n`);
