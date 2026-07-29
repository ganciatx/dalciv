import { NextResponse } from "next/server";
import { presentationToCsvZip } from "@/lib/export/csv-zip";
import { loadAuthorizedPresentation } from "@/lib/export/load-authorized";

export const runtime = "nodejs";

type Params = { params: Promise<{ frameId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { frameId } = await params;
  const result = await loadAuthorizedPresentation(frameId);
  if ("error" in result) return result.error;

  const zip = presentationToCsvZip(result.payload);
  const filename = `${result.basename}.zip`;

  return new NextResponse(Buffer.from(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
