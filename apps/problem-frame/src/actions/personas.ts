"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { painPoints, personas } from "@/db/schema";
import { requireOrgSession } from "@/lib/require-org";

export async function listPersonasForOrg() {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  return db.query.personas.findMany({
    where: eq(personas.organizationId, orgId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
}

export async function createPersona(formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const personaName = String(formData.get("personaName") ?? "").trim();
  if (!personaName) throw new Error("Persona name is required.");
  await db.insert(personas).values({
    organizationId: orgId,
    personaName,
    description: String(formData.get("description") ?? "").trim() || null,
    goals: String(formData.get("goals") ?? "").trim() || null,
    behaviors: String(formData.get("behaviors") ?? "").trim() || null,
    contextOfUse: String(formData.get("contextOfUse") ?? "").trim() || null,
    techSavviness: String(formData.get("techSavviness") ?? "").trim() || null,
    customerSegment: String(formData.get("customerSegment") ?? "").trim() || null,
    createdDate: new Date().toISOString().slice(0, 10),
    createdByUserId: session.user.id,
  });
  revalidatePath("/personas");
  revalidatePath("/products", "layout");
}

export async function updatePersona(personaId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const persona = await db.query.personas.findFirst({
    where: eq(personas.id, personaId),
  });
  if (!persona || persona.organizationId !== orgId) {
    throw new Error("Persona not found.");
  }
  const personaName = String(formData.get("personaName") ?? "").trim();
  if (!personaName) throw new Error("Persona name is required.");
  await db
    .update(personas)
    .set({
      personaName,
      description: String(formData.get("description") ?? "").trim() || null,
      goals: String(formData.get("goals") ?? "").trim() || null,
      behaviors: String(formData.get("behaviors") ?? "").trim() || null,
      contextOfUse: String(formData.get("contextOfUse") ?? "").trim() || null,
      techSavviness: String(formData.get("techSavviness") ?? "").trim() || null,
      customerSegment: String(formData.get("customerSegment") ?? "").trim() || null,
    })
    .where(eq(personas.id, personaId));
  revalidatePath("/personas");
  revalidatePath("/products", "layout");
}

export async function addPainPoint(formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const personaId = Number(formData.get("personaId"));
  if (!Number.isFinite(personaId)) throw new Error("Invalid persona.");
  const persona = await db.query.personas.findFirst({
    where: eq(personas.id, personaId),
  });
  if (!persona || persona.organizationId !== orgId) {
    throw new Error("Persona not found.");
  }
  const text = String(formData.get("painPointText") ?? "").trim();
  if (!text) throw new Error("Pain point text is required.");
  const severity = Number(formData.get("severity") ?? 3);
  await db.insert(painPoints).values({
    personaId,
    painPointText: text,
    severity: Number.isFinite(severity) ? severity : 3,
    frequency: String(formData.get("frequency") ?? "").trim() || null,
  });
  revalidatePath("/personas");
}
