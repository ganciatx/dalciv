"use server";

import { eq, and, inArray, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, problemFrames } from "@/db/schema";
import { requireOrgSession } from "@/lib/require-org";

export async function createProduct(formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const productName = String(formData.get("productName") ?? "").trim();
  const productCode = String(formData.get("productCode") ?? "").trim();
  if (!productName || !productCode) {
    throw new Error("Product name and code are required.");
  }
  await db.insert(products).values({
    organizationId: orgId,
    productName,
    productCode,
    productCategory:
      String(formData.get("productCategory") ?? "").trim() || null,
    launchDate: String(formData.get("launchDate") ?? "").trim() || null,
    status: String(formData.get("status") ?? "Active"),
  });
  revalidatePath("/products");
}

export async function listProductsForOrg() {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  return db.query.products.findMany({
    where: eq(products.organizationId, orgId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
}

/** Products with `lastActivityMs` = max(createdAt, latest frame activity) for list “Last updated”. */
export async function listProductsWithActivity() {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const rows = await db.query.products.findMany({
    where: eq(products.organizationId, orgId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const agg = await db
    .select({
      productId: problemFrames.productId,
      maxLu: max(problemFrames.lastUpdated),
    })
    .from(problemFrames)
    .where(inArray(problemFrames.productId, ids))
    .groupBy(problemFrames.productId);
  const latestByProduct = new Map(
    agg.map((a) => [a.productId, a.maxLu]),
  );
  return rows.map((p) => {
    const lu = latestByProduct.get(p.id);
    const createdMs = p.createdAt.getTime();
    const frameMs = lu ? new Date(lu).getTime() : 0;
    return {
      ...p,
      lastActivityMs: Math.max(createdMs, frameMs),
    };
  });
}

export async function getProduct(productId: number, orgId: string) {
  const row = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.organizationId, orgId)),
  });
  return row;
}
