import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getProduct } from "@/actions/products";
import {
  getFrameForOrg,
  listFrameVersions,
} from "@/actions/frames";
import { listPersonasForOrg } from "@/actions/personas";
import { requireOrgSession } from "@/lib/require-org";
import { FrameWorkflow } from "@/components/frame-detail/frame-workflow";
import { FrameExportControls } from "@/components/frame-detail/frame-export-controls";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { customerFeedback as feedbackTable } from "@/db/schema";

type Props = {
  params: Promise<{ productId: string; frameId: string }>;
};

export default async function FrameDetailPage({ params }: Props) {
  const { productId: p, frameId: f } = await params;
  const productId = Number(p);
  const frameId = Number(f);
  if (!Number.isFinite(productId) || !Number.isFinite(frameId)) notFound();

  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!session.session.activeOrganizationId) redirect("/org/new");
  const orgSession = await requireOrgSession();
  const orgId = orgSession.session.activeOrganizationId;

  const product = await getProduct(productId, orgId);
  if (!product) notFound();

  const frame = await getFrameForOrg(frameId);
  if (!frame || frame.productId !== productId) notFound();

  const [versions, personas, feedbackRows] = await Promise.all([
    listFrameVersions(frameId),
    listPersonasForOrg(),
    db.query.customerFeedback.findMany({
      where: eq(feedbackTable.productId, productId),
      orderBy: (fb, { desc }) => [desc(fb.createdAt)],
    }),
  ]);

  return (
    <div>
      <div className="text-sm text-zinc-500">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/products/${productId}/frames`}
          className="hover:underline"
        >
          {product.productName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800 dark:text-zinc-200">
          {frame.frameTitle}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {frame.frameTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Version {frame.version} · Persona:{" "}
            {frame.persona?.personaName ?? "—"} · Use the steps to structure your
            framing; changes save automatically on the first step.
          </p>
        </div>
        <FrameExportControls frameId={frameId} />
      </div>

      <Suspense
        fallback={
          <div className="mt-8 animate-pulse rounded-xl border border-zinc-200 p-8 text-sm text-zinc-500 dark:border-zinc-800">
            Loading workflow…
          </div>
        }
      >
        <FrameWorkflow
          frame={frame}
          frameId={frameId}
          productId={productId}
          personas={personas.map((pe) => ({
            id: pe.id,
            personaName: pe.personaName,
          }))}
          versions={versions}
          feedbackRows={feedbackRows}
        />
      </Suspense>
    </div>
  );
}
