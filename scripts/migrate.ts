import { readdir, readFile } from "node:fs/promises";
import postgres from "postgres";
import { splitSql } from "../lib/sql/split";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set. The migration was not applied.");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
const directory = new URL("../db/migrations/", import.meta.url);

try {
  await sql`create table if not exists schema_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  )`;
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  const appliedRows = await sql<{ filename: string }[]>`select filename from schema_migrations`;
  const applied = new Set(appliedRows.map((row) => row.filename));
  const authRows = await sql<{ exists: boolean }[]>`
    select exists(select 1 from information_schema.schemata where schema_name = 'auth') as exists
  `;
  const hasAuth = Boolean(authRows[0]?.exists);

  for (const file of files) {
    if (applied.has(file)) continue;
    if ((file.startsWith("002") || file.startsWith("003") || file.startsWith("004")) && !hasAuth) {
      console.error(
        `${file} was not applied. This database has no Supabase auth schema. Run it in the Supabase SQL editor.`,
      );
      process.exitCode = 1;
      continue;
    }
    const source = await readFile(new URL(file, directory), "utf8");
    for (const statement of splitSql(source)) {
      await sql.unsafe(statement);
    }
    await sql`insert into schema_migrations (filename) values (${file})`;
    console.log(`Applied ${file}`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown";
  console.error("Migration failed.", message.replace(url, "[redacted]"));
  process.exitCode = 1;
} finally {
  await sql.end();
}
