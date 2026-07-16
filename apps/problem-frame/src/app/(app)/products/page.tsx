import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { listProductsWithActivity } from "@/actions/products";
import { requireOrgSession } from "@/lib/require-org";
import { ProductsPageClient } from "@/components/products/products-page-client";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!session.session.activeOrganizationId) redirect("/org/new");
  await requireOrgSession();
  const productList = await listProductsWithActivity();

  const rows = productList.map((p) => ({
    id: p.id,
    productName: p.productName,
    productCode: p.productCode,
    status: p.status,
    lastActivityMs: p.lastActivityMs,
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Products
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Problem frames are grouped under each product.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ProductsPageClient products={rows} />
      </div>
    </div>
  );
}
