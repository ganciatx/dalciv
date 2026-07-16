import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getProduct } from "@/actions/products";
import { listFramesForProductWithCounts } from "@/actions/frames";
import { listPersonasForOrg } from "@/actions/personas";
import { requireOrgSession } from "@/lib/require-org";
import { FramesListClient } from "@/components/frames/frames-list-client";

type Props = { params: Promise<{ productId: string }> };

export default async function FramesListPage({ params }: Props) {
  const { productId: pid } = await params;
  const productId = Number(pid);
  if (!Number.isFinite(productId)) notFound();

  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!session.session.activeOrganizationId) redirect("/org/new");
  const orgSession = await requireOrgSession();
  const orgId = orgSession.session.activeOrganizationId;

  const product = await getProduct(productId, orgId);
  if (!product) notFound();

  const [frames, personas] = await Promise.all([
    listFramesForProductWithCounts(productId),
    listPersonasForOrg(),
  ]);

  const frameRows = frames.map((f) => ({
    id: f.id,
    frameTitle: f.frameTitle,
    status: f.status,
    lastUpdated: f.lastUpdated,
    createdDate: f.createdDate,
    persona: f.persona
      ? { id: f.persona.id, personaName: f.persona.personaName }
      : null,
    barrierCount: f.barrierCount,
    hypothesisCount: f.hypothesisCount,
  }));

  return (
    <div>
      <div className="text-sm text-zinc-500">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800 dark:text-zinc-200">
          {product.productName}
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Problem frames
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Capture problem statements, evidence, and hypotheses in a guided workflow.
      </p>

      <div className="mt-8">
        <FramesListClient
          productId={productId}
          productName={product.productName}
          frames={frameRows}
          personas={personas.map((p) => ({ id: p.id, personaName: p.personaName }))}
        />
      </div>
    </div>
  );
}
