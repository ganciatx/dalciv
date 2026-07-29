# Feature Implementation Plan

**Overall Progress:** `10%`

## TLDR

Add **PDF** and **CSV** export of a problem frame’s **presentation state** — the stakeholder-facing view of the live frame, ordered like the 6 workflow steps — from the frame detail page. Reuse and extend the existing snapshot loader; generate files server-side behind org auth. No learning-plan export, no bulk multi-frame pack in v1.

## Critical Decisions

- **Presentation state = live working copy** — Export the current frame graph (not a historical `problemFrameVersions` row). Version number / title appear in the header; exporting a saved snapshot is deferred.
- **One shared presentation payload** — Enrich `loadFrameSnapshotPayload` (or a sibling loader) with product name/code, persona name (+ goals/behaviors for PDF), and **barrier-linked** customer feedback only. PDF and CSV are two mappers over the same payload.
- **PDF = narrative deck/doc** — Sections mirror workflow steps 1–6; omit internal IDs, createdBy, raw FKs. Hypothesis metrics included only when present (light subsection).
- **CSV = tabular pack (ZIP of CSVs)** — One file per entity type (`frame.csv`, `outcomes.csv`, `barriers.csv`, `root_causes.csv`, …) plus `evidence.csv` for linked feedback. Avoid a single messy denormalized sheet.
- **Server Route Handlers** — `GET` under `src/app/api/frames/[frameId]/export/{pdf|csv}` (or one route with `?format=`). Call `requireOrgSession` + same product-org check as `getFrameForOrg`. Do not generate PDF/CSV purely client-side with an ungated payload.
- **Deps stay in-app** — Add a PDF library inside `apps/problem-frame` only (prefer server-friendly; crossword’s client `jspdf` is a reference, not a cross-app import). CSV via small hand-rolled escape helper — no heavy CSV framework.
- **UX primary surface** — Export control on frame detail header (next to version chrome / step 1 snapshot area). Frames-list bulk export out of scope for v1.
- **Out of scope (v1)** — Learning plans, persona pain-points dump, full product feedback dump, restore-from-snapshot, print CSS-only fallback as the main path.

## Tasks

- [ ] 🟡 **Step 1: Presentation payload**
  - [ ] 🟡 Define a typed `FramePresentationPayload` (header + children + linked evidence)
  - [ ] 🟡 Implement `loadFramePresentationPayload(frameId, orgId)` reusing snapshot relations; join product, persona; load feedback rows linked via `feedbackBarrierLink` to this frame’s barriers
  - [ ] 🟡 Keep `loadFrameSnapshotPayload` for versioning; share query `with:` where possible — don’t fork two unrelated graphs

- [ ] 🟥 **Step 2: CSV mapper + download route**
  - [ ] 🟥 Pure `presentationToCsvZip(payload)` → `Uint8Array` / `Blob` (ZIP of UTF-8 CSVs with proper quoting)
  - [ ] 🟥 Org-gated Route Handler returning `application/zip` with filename like `{productCode}_{frameTitle}_v{n}.zip`
  - [ ] 🟥 Smoke-test: unauthorized → redirect/401; wrong org frame → 404; happy path downloads non-empty zip

- [ ] 🟥 **Step 3: PDF mapper + download route**
  - [ ] 🟥 Pure `presentationToPdf(payload)` laying out steps 1–6 (title/statement/persona → barriers/emotions → outcomes → constraints/assumptions → hypotheses → evidence quotes)
  - [ ] 🟥 Org-gated Route Handler returning `application/pdf` with a stable filename
  - [ ] 🟥 Add PDF dependency to `apps/problem-frame/package.json` only; document in app `README.md`

- [ ] 🟥 **Step 4: Frame detail export UI**
  - [ ] 🟥 Add “Export PDF” / “Export CSV” controls on `…/frames/[frameId]/page.tsx` (or a thin client menu in the header)
  - [ ] 🟥 Wire to authenticated download URLs (same-origin cookie session); loading/disabled state while fetching
  - [ ] 🟥 Match existing chrome (no new design system)

- [ ] 🟥 **Step 5: Verify**
  - [ ] 🟥 Export a frame with all section types populated; confirm PDF sections and CSV files match UI content
  - [ ] 🟥 Confirm empty sections don’t crash; evidence section empty when no barrier links
  - [ ] 🟥 `npm run lint` / `npm run build` in `apps/problem-frame`

## Out of scope (v1)

- Export of a specific saved snapshot / version picker
- Bulk export from frames list or product-level pack
- Learning-plan PDF/CSV
- Client-only print stylesheet as the primary delivery mechanism
- Cross-app shared export utilities with crossword-constructor
