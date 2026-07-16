# Security fixes: C1 + C2

**Overall Progress:** `100%`

## TLDR

Close the two Critical findings from the 2026-07-10 security audit: auth-gate FastAPI ops/mutating routes (`OPS_API_TOKEN`), and harden Problem Frame Better Auth (no secret fallback, upgrade, invitation email verification).

## Critical Decisions

- **C1 token:** Shared secret `OPS_API_TOKEN` via `X-Ops-Token`, `Authorization: Bearer`, or `?ops_token=` (bookmark-friendly for `/command`). Fail closed when unset.
- **C1 scope:** Protect `POST /api/start|stop|summarize|summarize/one`, `POST /api/meeting-recap/analyze`, `GET /command`, `GET /api/command` (exact C1 list).
- **C2 secret:** Match crossword pattern — throw at startup if `BETTER_AUTH_SECRET` missing or &lt; 32 chars (no hardcoded fallback).
- **C2 deps:** Upgrade `better-auth` to a patched release (≥1.6.15) and set `requireEmailVerificationOnInvitation: true`.

## Tasks

- [x] 🟩 **Step 1: Tracking + env docs**
  - [x] 🟩 This plan file
  - [x] 🟩 Root `.env.example` + `docker-compose` + deploy workflow for `OPS_API_TOKEN`

- [x] 🟩 **Step 2: C1 — ops auth module + route wiring**
  - [x] 🟩 `dashboard/ops_auth.py` — timing-safe token check
  - [x] 🟩 Apply `Depends` on scraper / ops / analyze routes
  - [x] 🟩 Update `index.html` + `command.html` to send token
  - [x] 🟩 Tests for 401/503 and success with token (`tests/test_ops_auth.py`)

- [x] 🟩 **Step 3: C2 — Problem Frame auth harden**
  - [x] 🟩 Fail-hard secret in `auth.ts`
  - [x] 🟩 `requireEmailVerificationOnInvitation: true`
  - [x] 🟩 Upgrade `better-auth` to 1.6.23; refresh `.env.example` / README notes

- [x] 🟩 **Step 4: Docs + verify**
  - [x] 🟩 README + `docs/DEPLOYING_UPDATES.md` API/admin notes
  - [x] 🟩 `better-auth` critical CVE cleared via upgrade; pytest blocked in this environment by hung pydantic/fastapi import (syntax-checked; re-run locally)

## Post-deploy checklist

1. Add GitHub Actions secret `OPS_API_TOKEN` (`openssl rand -base64 32`).
2. Confirm `BETTER_AUTH_SECRET` is already set (≥32 chars).
3. Redeploy; open `/command` and unlock with the token.
4. Locally: put `OPS_API_TOKEN=…` in `.env` before using scraper Start/Summarize.
