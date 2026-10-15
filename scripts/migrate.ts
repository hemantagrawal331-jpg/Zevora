import { readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set. The migration was not applied.");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  const file = await readFile(new URL("../db/migrations/001_sourcing_records.sql", import.meta.url), "utf8");
  const statements = file
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.unsafe(statement);
  }
  console.log("Applied 001_sourcing_records.sql");
} catch (error) {
  console.error("Migration failed.", error instanceof Error ? error.name : "unknown");
  process.exitCode = 1;
} finally {
  await sql.end();
}
