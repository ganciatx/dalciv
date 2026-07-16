import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { requireOrgSession } from "@/lib/require-org";
import { listLearningPlansForOrg } from "@/actions/learning-plans";
import { listProductsForOrg } from "@/actions/products";
import { LearningPlansListClient } from "@/components/learning-plans/learning-plans-list-client";

export default async function LearningPlansPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!session.session.activeOrganizationId) redirect("/org/new");
  await requireOrgSession();

  const [plans, products] = await Promise.all([
    listLearningPlansForOrg(),
    listProductsForOrg(),
  ]);

  const rows = plans.map((p) => ({
    id: p.id,
    planName: p.planName,
    timeframe: p.timeframe,
    status: p.status,
    productName: p.product?.productName ?? null,
    assumptionCount: p.assumptionCount,
    lastUpdatedMs: p.lastUpdated.getTime(),
  }));

  const productOptions = products.map((p) => ({
    id: p.id,
    productName: p.productName,
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Learning Plans
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Track critical assumptions and the experiments that test them.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <LearningPlansListClient plans={rows} products={productOptions} />
      </div>
    </div>
  );
}
