# Feature Implementation Plan

**Overall Progress:** `0%`

## TLDR

Harden Problem Frame (`apps/problem-frame`, `https://frames.ganciatx.com`) for enterprise data security: lock down who can join, enforce org RBAC, protect auth against abuse, add browser/security headers, gate all data helpers, and add audit + retention basics for customer/PII-bearing content — without changing the standalone Next.js + Better Auth + SQLite architecture.

## Critical Decisions

- **Keep SQLite + Better Auth** — Stay on the current stack; do not migrate to Postgres/IdP in this plan. Encryption-at-rest is volume/host-level (backups + disk permissions), not SQLCipher (high ops cost, little gain on a single-tenant volume today).
- **Invite-only by default** — Disable public `/register` in production via env (`ALLOW_PUBLIC_SIGNUP=false`); new users join via org invitation only. Local/dev can keep open signup.
- **Email verification on signup when public signup is on** — Require verified email before creating orgs / mutating data when self-registration is enabled.
- **RBAC: admin vs member** — Enforce Better Auth `member.role`: admins manage invites/org; members read/write product data; both stay org-scoped.
- **Defense in depth for authz** — Add Next.js middleware session gate + keep `requireOrgSession` on actions; fix ungated helpers (`loadFrameSnapshotPayload`) before export routes ship.
- **Audit log (append-only table)** — Log authz-sensitive events (login failures optional later; invite, role change, delete, export) in SQLite — no external SIEM yet.
- **Out of scope (explicit)** — SSO/SAML/OIDC, field-level encryption, GDPR automated DSAR portal, CSP nonce refactor beyond baseline headers, rate-limit redis (in-process/Caddy is enough).

## Tasks:

- [ ] 🟥 **Step 1: Access control — signup & email**
  - [ ] 🟥 Add `ALLOW_PUBLIC_SIGNUP` (default `false` in prod compose); hide/disable `/register` when false
  - [ ] 🟥 Enable Better Auth email verification when public signup is allowed; block unverified users from org create / app layout
  - [ ] 🟥 Document invite-only flow in `apps/problem-frame/README.md` + `.env.example`

- [ ] 🟥 **Step 2: Org RBAC**
  - [ ] 🟥 Helper `requireOrgRole("admin" | "member")` on top of `requireOrgSession`
  - [ ] 🟥 Restrict invite / org settings mutations to `admin`
  - [ ] 🟥 Keep product/frame/persona/learning-plan CRUD available to all org members; surface role in org UI

- [ ] 🟥 **Step 3: Auth abuse & session hardening**
  - [ ] 🟥 Rate-limit `/api/auth/*` (Caddy or lightweight Next middleware) for sign-in / sign-up
  - [ ] 🟥 Confirm Better Auth cookie flags (Secure, HttpOnly, SameSite) for `frames.ganciatx.com`
  - [ ] 🟥 Optional: password min length align server-side with register form (`minLength={8}`)

- [ ] 🟥 **Step 4: Request gating & data-helper footguns**
  - [ ] 🟥 Add `middleware.ts` redirecting unauthenticated users away from `(app)` routes
  - [ ] 🟥 Gate `loadFrameSnapshotPayload` with org check (or only call from already-gated wrappers)
  - [ ] 🟥 Audit all server actions for consistent `requireOrgSession` + `organizationId` checks

- [ ] 🟥 **Step 5: Browser & transport headers**
  - [ ] 🟥 Add CSP (+ Permissions-Policy) in Caddy for `frames.ganciatx.com` and/or `next.config.ts` headers
  - [ ] 🟥 Keep existing HSTS / X-Content-Type-Options / X-Frame-Options / Referrer-Policy

- [ ] 🟥 **Step 6: Audit trail for sensitive actions**
  - [ ] 🟥 Drizzle table `audit_events` (orgId, actorUserId, action, resourceType, resourceId, metadata JSON, createdAt)
  - [ ] 🟥 Write events for: invite, member role change, org create, destructive deletes, future export downloads
  - [ ] 🟥 Admin-only read UI or simple list on `/org` (minimal)

- [ ] 🟥 **Step 7: Data lifecycle (retention / deletion)**
  - [ ] 🟥 Document what PII/customer text exists (`user`, invitations, `customer_feedback`, frame snapshots)
  - [ ] 🟥 Admin action: delete org member (Better Auth) + confirm cascade behavior for org data
  - [ ] 🟥 Document backup/restore of `problem_frame_data` volume; note plaintext-at-rest host responsibility

- [ ] 🟥 **Step 8: Input bounds & export readiness**
  - [ ] 🟥 Add length caps / basic validation on free-text fields (feedback comments, problem statements) before DB write
  - [ ] 🟥 When export plan ships: re-use org gate + audit log on every download (cross-link `PROBLEM_FRAME_EXPORT_PLAN.md`)

- [ ] 🟥 **Step 9: Verify + docs**
  - [ ] 🟥 Manual checklist: invite-only prod, member cannot invite, admin can, unauthenticated middleware redirect, CSP no break login
  - [ ] 🟥 Update `docs/DEPLOYING_UPDATES.md` + `CHANGELOG.md` for new env vars and behavior
