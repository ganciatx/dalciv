import type { FramePresentationPayload } from "@/lib/frame-presentation";

/** RFC-style CSV cell: quote when needed; double internal quotes. */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return lines.join("\r\n") + (lines.length > 0 ? "\r\n" : "");
}

/**
 * Build a ZIP (STORE / no compression) of UTF-8 CSV files — one sheet per entity type.
 * Avoids a denormalized mega-sheet and keeps deps light (no CSV/ZIP frameworks).
 */
export function presentationToCsvZip(payload: FramePresentationPayload): Uint8Array {
  const files: Array<{ name: string; content: string }> = [
    {
      name: "frame.csv",
      content: rowsToCsv(
        [
          "product_code",
          "product_name",
          "frame_title",
          "problem_statement",
          "status",
          "version",
          "persona_name",
        ],
        [
          [
            payload.header.productCode,
            payload.header.productName,
            payload.header.frameTitle,
            payload.header.problemStatement,
            payload.header.status,
            payload.header.version,
            payload.header.personaName,
          ],
        ],
      ),
    },
    {
      name: "outcomes.csv",
      content: rowsToCsv(
        ["outcome_text", "priority_rank", "jtbd_category"],
        payload.outcomes.map((o) => [o.outcomeText, o.priorityRank, o.jtbdCategory]),
      ),
    },
    {
      name: "barriers.csv",
      content: rowsToCsv(
        [
          "barrier_text",
          "barrier_category",
          "severity",
          "frequency",
          "impact_percentage",
        ],
        payload.barriers.map((b) => [
          b.barrierText,
          b.barrierCategory,
          b.severity,
          b.frequency,
          b.impactPercentage,
        ]),
      ),
    },
    {
      name: "root_causes.csv",
      content: rowsToCsv(
        ["barrier_text", "cause_text", "cause_type", "validated"],
        payload.barriers.flatMap((b) =>
          b.rootCauses.map((rc) => [
            b.barrierText,
            rc.causeText,
            rc.causeType,
            rc.validated,
          ]),
        ),
      ),
    },
    {
      name: "emotional_impacts.csv",
      content: rowsToCsv(
        ["emotion_text", "emotion_category", "intensity"],
        payload.emotionalImpacts.map((e) => [
          e.emotionText,
          e.emotionCategory,
          e.intensity,
        ]),
      ),
    },
    {
      name: "constraints.csv",
      content: rowsToCsv(
        ["constraint_text", "constraint_type", "is_modifiable"],
        payload.constraints.map((c) => [
          c.constraintText,
          c.constraintType,
          c.isModifiable,
        ]),
      ),
    },
    {
      name: "assumptions.csv",
      content: rowsToCsv(
        ["assumption_code", "assumption_text", "validation_status"],
        payload.assumptions.map((a) => [
          a.assumptionCode,
          a.assumptionText,
          a.validationStatus,
        ]),
      ),
    },
    {
      name: "hypotheses.csv",
      content: rowsToCsv(
        [
          "hypothesis_title",
          "barrier_text",
          "if_statement",
          "then_statement",
          "because_statement",
          "priority",
          "effort",
          "impact",
          "confidence",
          "status",
        ],
        payload.hypotheses.map((h) => [
          h.hypothesisTitle,
          h.barrierText,
          h.ifStatement,
          h.thenStatement,
          h.becauseStatement,
          h.priority,
          h.effort,
          h.impact,
          h.confidence,
          h.status,
        ]),
      ),
    },
    {
      name: "hypothesis_metrics.csv",
      content: rowsToCsv(
        [
          "hypothesis_title",
          "metric_name",
          "baseline_value",
          "target_value",
          "measurement_method",
          "actual_value",
        ],
        payload.hypotheses.flatMap((h) =>
          h.metrics.map((m) => [
            h.hypothesisTitle,
            m.metricName,
            m.baselineValue,
            m.targetValue,
            m.measurementMethod,
            m.actualValue,
          ]),
        ),
      ),
    },
    {
      name: "evidence.csv",
      content: rowsToCsv(
        [
          "barrier_text",
          "comment_text",
          "response_date",
          "question_type",
          "theme",
          "sentiment",
        ],
        payload.evidence.map((e) => [
          e.barrierText,
          e.commentText,
          e.responseDate,
          e.questionType,
          e.theme,
          e.sentiment,
        ]),
      ),
    },
  ];

  return buildStoreZip(files);
}

/** Minimal ZIP writer (stored / uncompressed entries). */
function buildStoreZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.content);
    const crc = crc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // method: store
    lv.setUint16(10, 0, true); // time
    lv.setUint16(12, 0, true); // date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra length
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((n, p) => n + p.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return concatBytes([...localParts, ...centralParts, end]);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
