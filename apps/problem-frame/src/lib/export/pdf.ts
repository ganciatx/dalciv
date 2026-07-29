import { jsPDF } from "jspdf";
import type { FramePresentationPayload } from "@/lib/frame-presentation";

const MARGIN = 18;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE = 5.2;
const SECTION_GAP = 8;

/**
 * Narrative PDF mirroring workflow steps 1–6.
 * Omits internal IDs / FKs; includes hypothesis metrics only when present.
 */
export function presentationToPdf(payload: FramePresentationPayload): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const writeWrapped = (
    text: string,
    opts: { size?: number; style?: "normal" | "bold"; color?: [number, number, number] } = {},
  ) => {
    const size = opts.size ?? 10;
    const style = opts.style ?? "normal";
    const color = opts.color ?? ([40, 40, 40] as [number, number, number]);
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    for (const line of lines) {
      ensureSpace(LINE);
      doc.text(line, MARGIN, y);
      y += LINE;
    }
  };

  const sectionTitle = (label: string) => {
    y += SECTION_GAP;
    ensureSpace(LINE + 2);
    writeWrapped(label, { size: 13, style: "bold", color: [42, 95, 102] });
    y += 1;
  };

  const bullet = (text: string) => writeWrapped(`• ${text}`);
  const emptyNote = (msg: string) =>
    writeWrapped(msg, { size: 9, color: [120, 120, 120] });

  // Document header
  writeWrapped(payload.header.productName, {
    size: 9,
    color: [100, 100, 100],
  });
  writeWrapped(payload.header.frameTitle, { size: 18, style: "bold" });
  writeWrapped(
    `${payload.header.productCode} · Version ${payload.header.version} · ${payload.header.status}`,
    { size: 9, color: [100, 100, 100] },
  );

  // Step 1 — Define Problem
  sectionTitle("1. Define Problem");
  if (payload.header.problemStatement?.trim()) {
    writeWrapped(payload.header.problemStatement.trim());
  } else {
    emptyNote("No problem statement yet.");
  }
  writeWrapped(`Persona: ${payload.header.personaName}`, { style: "bold", size: 10 });
  if (payload.header.personaGoals?.trim()) {
    writeWrapped(`Goals: ${payload.header.personaGoals.trim()}`, { size: 9 });
  }
  if (payload.header.personaBehaviors?.trim()) {
    writeWrapped(`Behaviors: ${payload.header.personaBehaviors.trim()}`, { size: 9 });
  }

  // Step 2 — Understand User
  sectionTitle("2. Understand User");
  writeWrapped("Barriers", { style: "bold", size: 11 });
  if (payload.barriers.length === 0) {
    emptyNote("No barriers captured.");
  } else {
    for (const b of payload.barriers) {
      const meta = [b.barrierCategory, b.severity, b.frequency]
        .filter(Boolean)
        .join(" · ");
      bullet(meta ? `${b.barrierText} (${meta})` : b.barrierText);
      for (const rc of b.rootCauses) {
        writeWrapped(
          `    – Root cause: ${rc.causeText}${rc.causeType ? ` [${rc.causeType}]` : ""}`,
          { size: 9 },
        );
      }
    }
  }
  writeWrapped("Emotional impacts", { style: "bold", size: 11 });
  if (payload.emotionalImpacts.length === 0) {
    emptyNote("No emotional impacts captured.");
  } else {
    for (const e of payload.emotionalImpacts) {
      const meta = [e.emotionCategory, e.intensity != null ? `intensity ${e.intensity}` : null]
        .filter(Boolean)
        .join(" · ");
      bullet(meta ? `${e.emotionText} (${meta})` : e.emotionText);
    }
  }

  // Step 3 — Outcomes
  sectionTitle("3. Define Outcomes");
  if (payload.outcomes.length === 0) {
    emptyNote("No outcomes defined.");
  } else {
    for (const o of payload.outcomes) {
      const meta = [
        o.priorityRank != null ? `priority ${o.priorityRank}` : null,
        o.jtbdCategory,
      ]
        .filter(Boolean)
        .join(" · ");
      bullet(meta ? `${o.outcomeText} (${meta})` : o.outcomeText);
    }
  }

  // Step 4 — Constraints & Assumptions
  sectionTitle("4. Constraints & Assumptions");
  writeWrapped("Constraints", { style: "bold", size: 11 });
  if (payload.constraints.length === 0) {
    emptyNote("No constraints listed.");
  } else {
    for (const c of payload.constraints) {
      const meta = [
        c.constraintType,
        c.isModifiable === false ? "fixed" : c.isModifiable === true ? "modifiable" : null,
      ]
        .filter(Boolean)
        .join(" · ");
      bullet(meta ? `${c.constraintText} (${meta})` : c.constraintText);
    }
  }
  writeWrapped("Assumptions", { style: "bold", size: 11 });
  if (payload.assumptions.length === 0) {
    emptyNote("No assumptions listed.");
  } else {
    for (const a of payload.assumptions) {
      const label = a.assumptionCode
        ? `${a.assumptionCode}: ${a.assumptionText}`
        : a.assumptionText;
      bullet(
        a.validationStatus ? `${label} — ${a.validationStatus}` : label,
      );
    }
  }

  // Step 5 — Hypotheses
  sectionTitle("5. Hypotheses");
  if (payload.hypotheses.length === 0) {
    emptyNote("No hypotheses yet.");
  } else {
    for (const h of payload.hypotheses) {
      writeWrapped(h.hypothesisTitle, { style: "bold", size: 10 });
      if (h.barrierText) {
        writeWrapped(`Barrier: ${h.barrierText}`, { size: 9 });
      }
      if (h.ifStatement) writeWrapped(`If: ${h.ifStatement}`, { size: 9 });
      if (h.thenStatement) writeWrapped(`Then: ${h.thenStatement}`, { size: 9 });
      if (h.becauseStatement) writeWrapped(`Because: ${h.becauseStatement}`, { size: 9 });
      const meta = [h.status, h.confidence, h.effort, h.impact]
        .filter(Boolean)
        .join(" · ");
      if (meta) writeWrapped(meta, { size: 9, color: [100, 100, 100] });
      if (h.metrics.length > 0) {
        writeWrapped("Metrics", { size: 9, style: "bold" });
        for (const m of h.metrics) {
          const parts = [
            m.metricName,
            m.baselineValue != null ? `baseline ${m.baselineValue}` : null,
            m.targetValue != null ? `target ${m.targetValue}` : null,
            m.actualValue != null ? `actual ${m.actualValue}` : null,
          ].filter(Boolean);
          bullet(parts.join(" · "));
        }
      }
      y += 2;
    }
  }

  // Step 6 — Evidence (barrier-linked only)
  sectionTitle("6. Evidence & Feedback");
  if (payload.evidence.length === 0) {
    emptyNote("No feedback linked to barriers on this frame.");
  } else {
    for (const e of payload.evidence) {
      writeWrapped(`“${e.commentText}”`, { size: 10 });
      const meta = [
        e.barrierText ? `→ ${e.barrierText}` : null,
        e.questionType,
        e.theme,
        e.sentiment,
        e.responseDate,
      ]
        .filter(Boolean)
        .join(" · ");
      if (meta) writeWrapped(meta, { size: 8, color: [100, 100, 100] });
      y += 2;
    }
  }

  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}
