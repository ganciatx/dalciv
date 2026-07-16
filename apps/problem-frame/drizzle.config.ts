import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    // Honor DATABASE_PATH so `db:migrate` targets the same file the app uses
    // (e.g. /app/data/app.db in the production container).
    url: process.env.DATABASE_PATH ?? "./data/app.db",
  },
});
