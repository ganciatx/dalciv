import { NextResponse } from "next/server";
import { presentationToPdf } from "@/lib/export/pdf";
import { loadAuthorizedPresentation } from "@/lib/export/load-authorized";

export const runtime = "nodejs";

type Params = { params: Promise<{ frameId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { frameId } = await params;
  const result = await loadAuthorizedPresentation(frameId);
  if ("error" in result) return result.error;

  const pdf = presentationToPdf(result.payload);
  const filename = `${result.basename}.pdf`;

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
