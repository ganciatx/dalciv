#!/usr/bin/env node
/**
 * Copy Next.js static export into the FastAPI static tree.
 * Run automatically after `npm run build` in portfolio/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const portfolioRoot = path.resolve(scriptDir, "..");
const outDir = path.join(portfolioRoot, "out");
const targetDir = path.resolve(
  portfolioRoot,
  "../dashboard/static/portfolio-site",
);

if (!fs.existsSync(path.join(outDir, "index.html"))) {
  console.error("Missing portfolio export — run `next build` first.");
  process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.cpSync(outDir, targetDir, { recursive: true });
console.log(`Synced portfolio export → ${targetDir}`);
