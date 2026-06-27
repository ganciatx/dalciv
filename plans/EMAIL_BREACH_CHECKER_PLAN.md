# Email Breach Checker — Implementation Plan

**Overall Progress:** `100%`

Trade-show booth demo for **H&R Block Tax Identity Shield**. Attendees enter an email to see public breach exposure, then get a product pitch for identity protection.

## TLDR

Kiosk-style Vite + React app at **`/breach-check`**. H&R Block green branding, large touch targets, masked email in results, top-5 breach cap, and "Scan another email" reset for the next visitor.

## Critical Decisions

- **XposedOrNot** API (free, proxied server-side) — same data layer, new booth UX.
- **Trade-show UX** — no portal link, attract hero with stats, risk gauge, product CTA.
- **Privacy** — mask email in results, demo disclaimer footer, no storage.

## Tasks

- [x] 🟩 **Step 1: Backend module** — `dashboard/breach_check.py` + API route
- [x] 🟩 **Step 2: Booth UI** — H&R Block branding, attract screen, risk gauge, product pitch
- [x] 🟩 **Step 3: Build** — output to `dashboard/static/breach-check/`
- [x] 🟩 **Step 4: FastAPI route + template** — `GET /breach-check`
- [x] 🟩 **Step 5: Portal** — renamed to Tax Identity Shield in catalog entries
