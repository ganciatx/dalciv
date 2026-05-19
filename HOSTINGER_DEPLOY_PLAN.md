# Hostinger Deployment Plan

**Overall Progress:** `85%`

## TLDR

Publish **Sivic Scraper** on your connected Hostinger account. **Business Web Hosting** cannot run Python/FastAPI; the app deploys to a **Hostinger VPS** via Docker. A free subdomain site is provisioned for branding; the live dashboard runs on the VPS URL (or a domain you point at it).

**Your hosting (connected account):**

| Resource | Value |
|----------|--------|
| Plan | Business (`hostinger_business_v4`) |
| Order ID | `1009365178` |
| Website (created) | [mediumturquoise-giraffe-322901.hostingersite.com](https://mediumturquoise-giraffe-322901.hostingersite.com) |
| VPS | None yet — **required for the full app** |

## Critical decisions

- **Decision 1: VPS + Docker** — FastAPI, Playwright, and long-running workers need root/Docker ([Hostinger FastAPI guide](https://www.hostinger.com/support/deploy-to-hostinger-vps-using-github-actions/)). Shared hosting JS/static deploy is not sufficient.

- **Decision 2: `SCRAPER_ENABLED=0` in production** — Public deploy exposes police map + council dashboards only; Legistar scrape start/stop returns 403 unless you set `SCRAPER_ENABLED=1` (Playwright is heavy and abuse-prone on a small VPS).

- **Decision 3: Persistent volumes** — `docker-compose.yml` mounts `scraper_dashboard_data` and `dallas_legistar_downloads` so caches and PDFs survive restarts.

- **Decision 4: GitHub Actions** — Use official [`hostinger/deploy-on-vps@v2`](https://github.com/hostinger/deploy-on-vps) with API key + VM ID (same credentials as Cursor Hostinger MCP).

## Tasks

- [x] 🟩 **Step 1: Production app config**
  - [x] 🟩 `DASHBOARD_HOST` / `DASHBOARD_PORT` env in `dashboard/__main__.py`
  - [x] 🟩 `SCRAPER_ENABLED` guard on `/api/start` and `/api/stop`
  - [x] 🟩 `proxy_headers` for reverse proxies

- [x] 🟩 **Step 2: Docker artifacts**
  - [x] 🟩 `Dockerfile` (Python 3.12 + Playwright Chromium)
  - [x] 🟩 `docker-compose.yml` (port 80 → 8765)
  - [x] 🟩 `.dockerignore`, `.env.example`

- [x] 🟩 **Step 3: Hostinger account setup**
  - [x] 🟩 Free subdomain generated
  - [x] 🟩 Website created on order `1009365178` (Phoenix DC)

- [x] 🟩 **Step 4: CI/CD**
  - [x] 🟩 `.github/workflows/deploy-hostinger.yml`

- [ ] 🟨 **Step 5: VPS provision (you)**
  - [ ] 🟥 Purchase / enable a Hostinger VPS in [hPanel](https://hpanel.hostinger.com/)
  - [ ] 🟥 Install Docker (Docker Manager in VPS panel, or `curl -fsSL https://get.docker.com | sh`)
  - [ ] 🟥 Note **VM ID** (e.g. `123456` from `srv123456.hstgr.cloud`)

- [ ] 🟨 **Step 6: Deploy app to VPS**
  - [ ] 🟥 Add GitHub secrets: `HOSTINGER_API_KEY` ([API settings](https://hpanel.hostinger.com/profile/api))
  - [ ] 🟥 Add GitHub variable: `HOSTINGER_VM_ID`
  - [ ] 🟥 Push to `main` or run **Deploy to Hostinger VPS** workflow
  - [ ] 🟥 **Or** on VPS: `git clone` → `docker compose up -d --build`

- [x] 🟩 **Step 7: Subdomain landing**
  - [x] 🟩 Static landing page in `deploy/hostinger-landing/`
  - [x] 🟩 Live at [mediumturquoise-giraffe-322901.hostingersite.com](https://mediumturquoise-giraffe-322901.hostingersite.com)

## Ongoing updates (after first deploy)

See **[docs/DEPLOYING_UPDATES.md](docs/DEPLOYING_UPDATES.md)** — plain-language guide for publishing changes, versioning (`CHANGELOG.md`), what data survives redeploy, and GitHub vs SSH workflows.

## Deploy landing page (static)

```bash
cd "/path/to/Sivic Scraper"
zip -r deploy/hostinger-landing_$(date +%Y%m%d_%H%M%S).zip deploy/hostinger-landing
# Upload via hPanel File Manager to public_html, or use Cursor Hostinger MCP:
# hosting_deployStaticWebsite(domain, archivePath)
```

## Deploy full app (VPS)

```bash
# On the VPS (SSH)
git clone <your-repo-url> sivic-scraper && cd sivic-scraper
cp .env.example .env   # edit SOCRATA_APP_TOKEN, SCRAPER_ENABLED if needed
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1/api/state
```

Open `http://<VPS_IP>/` — Legistar (`/`), police (`/police`), council (`/campaign-finance`).

## Point subdomain at VPS (optional)

After VPS has a public IP, in hPanel **DNS** add an **A record** for a hostname you control, or use the VPS hostname. The `*.hostingersite.com` site can stay as a landing page.

## Acceptance criteria

1. Website exists on Hostinger account. ✅
2. `docker compose up` builds and serves the dashboard on port 80. ✅ (local/VPS test)
3. VPS receives deploy via GitHub Action or manual compose. 🟨 (pending VPS)
4. Production has scraper disabled by default; maps/finance/voting work. ✅

## Files

| Path | Role |
|------|------|
| `Dockerfile` | Production image |
| `docker-compose.yml` | Hostinger VPS stack |
| `.github/workflows/deploy-hostinger.yml` | Auto deploy |
| `HOSTINGER_DEPLOY_PLAN.md` | This plan |
| `deploy/hostinger-landing/` | Static placeholder site |
