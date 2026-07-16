// Standalone migration runner for production containers.
//
// Applies the Drizzle SQL migrations in ./drizzle to the SQLite database at
// DATABASE_PATH before the app server starts. Uses only runtime dependencies
// (better-sqlite3 + drizzle-orm), so it works inside the Next.js `standalone`
// image without drizzle-kit (a devDependency).
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const dbPath = process.env.DATABASE_PATH ?? "./data/app.db";
const migrationsFolder = process.env.MIGRATIONS_FOLDER ?? "./drizzle";

// Ensure the parent directory (typically a mounted volume) exists.
mkdirSync(dirname(resolve(dbPath)), { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder });
sqlite.close();

console.log(`[migrate] applied migrations from ${migrationsFolder} to ${dbPath}`);
