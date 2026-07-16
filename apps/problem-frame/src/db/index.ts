import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const path = process.env.DATABASE_PATH ?? "./data/app.db";

export const sqlite = new Database(path);
export const db = drizzle(sqlite, { schema });
