import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/get-session";
import { requireOrgSession } from "@/lib/require-org";
import { getLearningPlanForOrg } from "@/actions/learning-plans";
import { listProductsForOrg } from "@/actions/products";
import { LearningPlanDetailClient } from "@/components/learning-plans/learning-plan-detail-client";

export default async function LearningPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId: planIdRaw } = await params;
  const planId = Number(planIdRaw);
  if (!Number.isFinite(planId)) notFound();

  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!session.session.activeOrganizationId) redirect("/org/new");
  await requireOrgSession();

  const [plan, products] = await Promise.all([
    getLearningPlanForOrg(planId),
    listProductsForOrg(),
  ]);
  if (!plan) notFound();

  const planData = {
    id: plan.id,
    planName: plan.planName,
    timeframe: plan.timeframe,
    idealState: plan.idealState,
    clientProblem: plan.clientProblem,
    status: plan.status,
    productId: plan.productId,
    assumptions: plan.assumptions.map((a) => ({
      id: a.id,
      assumptionType: a.assumptionType,
      assumptionText: a.assumptionText,
      experiments: a.experiments.map((e) => ({
        id: e.id,
        mode: e.mode,
        hypothesis: e.hypothesis,
        experiment: e.experiment,
        timeline: e.timeline,
        measure: e.measure,
        results: e.results,
        driverGroup: e.driverGroup,
      })),
    })),
  };

  const productOptions = products.map((p) => ({
    id: p.id,
    productName: p.productName,
  }));

  return (
    <div>
      <Link
        href="/learning-plans"
        className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
      >
        &larr; Learning Plans
      </Link>
      <div className="mt-4">
        <LearningPlanDetailClient plan={planData} products={productOptions} />
      </div>
    </div>
  );
}
