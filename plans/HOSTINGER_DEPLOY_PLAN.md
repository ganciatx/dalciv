# Hostinger Deployment Plan

**Overall Progress:** `100%`

## TLDR

Publish **Sivic Scraper** on your connected Hostinger account. **Business Web Hosting** cannot run Python/FastAPI; the app deploys to a **Hostinger VPS** via Docker. A free subdomain site is provisioned for branding; the live dashboard runs on the VPS URL (or a domain you point at it).

**Your hosting (connected account):**

| Resource | Value |
|----------|--------|
| Plan | Business (`hostinger_business_v4`) |
| Order ID | `1009365178` |
| Website (landing) | [mediumturquoise-giraffe-322901.hostingersite.com](https://mediumturquoise-giraffe-322901.hostingersite.com) |
| VPS | **VM ID `1685117`** — `168.231.65.105` (`srv1685117.hstgr.cloud`) |
| **Live app** | **[https://ganciatx.com/](https://ganciatx.com/)** (also [https://168.231.65.105/](https://168.231.65.105/) if cert allows IP) |
| Custom domain | `ganciatx.com` → A `168.231.65.105`; `www` → CNAME `ganciatx.com` |
| GitHub | [github.com/ganciatx/dalciv](https://github.com/ganciatx/dalciv) (public) |
| Docker project | `dalciv` on VPS — **Caddy** on host 80/443 → **sivic** on internal 8765 |

## Critical decisions

- **Decision 1: VPS + Docker** — FastAPI, Playwright, and long-running workers need root/Docker ([Hostinger FastAPI guide](https://www.hostinger.com/support/deploy-to-hostinger-vps-using-github-actions/)). Shared hosting JS/static deploy is not sufficient.

- **Decision 2: `SCRAPER_ENABLED=0` in production** — Public deploy exposes police map + council dashboards only; Legistar scrape start/stop returns 403 unless you set `SCRAPER_ENABLED=1` (Playwright is heavy and abuse-prone on a small VPS).

- **Decision 3: Persistent volumes** — `docker-compose.yml` mounts `scraper_dashboard_data` and `dallas_legistar_downloads` so caches and PDFs survive restarts.

- **Decision 4: GitHub Actions** — Use official [`hostinger/deploy-on-vps@v2`](https://github.com/hostinger/deploy-on-vps) with API key + VM ID (same credentials as Cursor Hostinger MCP).

- **Decision 5: Public GitHub repo** — Hostinger Docker Manager clones over HTTPS without credentials. Private repos fail at clone time.

## Tasks

- [x] 🟩 **Step 1: Production app config**
  - [x] 🟩 `DASHBOARD_HOST` / `DASHBOARD_PORT` env in `dashboard/__main__.py`
  - [x] 🟩 `SCRAPER_ENABLED` guard on `/api/start` and `/api/stop`
  - [x] 🟩 `proxy_headers` for reverse proxies

- [x] 🟩 **Step 2: Docker artifacts**
  - [x] 🟩 `Dockerfile` (Python 3.12 + Playwright Chromium)
  - [x] 🟩 `docker-compose.yml` (Caddy 80/443 → sivic 8765)
  - [x] 🟩 `deploy/caddy/` (Caddyfile + Dockerfile image; required for Hostinger Docker Manager)
  - [x] 🟩 `.dockerignore`, `.env.example`

- [x] 🟩 **Step 3: Hostinger account setup**
  - [x] 🟩 Free subdomain generated
  - [x] 🟩 Website created on order `1009365178` (Phoenix DC)

- [x] 🟩 **Step 4: CI/CD**
  - [x] 🟩 `.github/workflows/deploy-hostinger.yml`

- [x] 🟩 **Step 5: VPS provision**
  - [x] 🟩 VPS enabled — KVM 1, Ubuntu 24.04, VM `1685117`
  - [x] 🟩 Docker Manager / Docker installed
  - [x] 🟩 VM ID noted for GitHub variable `HOSTINGER_VM_ID=1685117`

- [x] 🟩 **Step 6: Deploy app to VPS**
  - [x] 🟩 Repo public on GitHub (`ganciatx/dalciv`)
  - [x] 🟩 Docker project `dalciv` deployed via Hostinger MCP (`docker_compose_up` success)
  - [x] 🟩 Verified: `/`, `/police`, `/campaign-finance` return 200
  - [ ] 🟨 Optional: GitHub secrets `HOSTINGER_API_KEY` + variable `HOSTINGER_VM_ID` for auto-deploy on push

- [x] 🟩 **Step 7: Subdomain landing**
  - [x] 🟩 Static landing page in `deploy/hostinger-landing/`
  - [x] 🟩 Live at [mediumturquoise-giraffe-322901.hostingersite.com](https://mediumturquoise-giraffe-322901.hostingersite.com)
  - [x] 🟩 Landing links to VPS app URL (`https://ganciatx.com`)

## Ongoing updates (after first deploy)

See **[docs/DEPLOYING_UPDATES.md](docs/DEPLOYING_UPDATES.md)** — plain-language guide for publishing changes, versioning (`CHANGELOG.md`), what data survives redeploy, and GitHub vs SSH workflows.

**Redeploy after code changes (no GitHub Actions yet):**

- In hPanel → VPS → Docker Manager → project `dalciv` → **Update** / pull latest, or
- Cursor Hostinger MCP: `VPS_updateProjectV1` with `virtualMachineId: 1685117`, `projectName: dalciv`

## Deploy landing page (static)

```bash
cd "/path/to/Sivic Scraper"
zip -r deploy/hostinger-landing_$(date +%Y%m%d_%H%M%S).zip deploy/hostinger-landing
# Upload via hPanel File Manager to public_html, or use Cursor Hostinger MCP:
# hosting_deployStaticWebsite(domain, archivePath)
```

## Deploy full app (VPS)

```bash
# On the VPS (SSH) — or use Docker Manager / MCP with GitHub URL
git clone https://github.com/ganciatx/dalciv.git && cd dalciv
cp .env.example .env   # edit SOCRATA_APP_TOKEN, ACME_EMAIL, SCRAPER_ENABLED if needed
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1/api/state   # via Caddy on port 80
```

Open **https://ganciatx.com/** — portal (`/`), council meetings (`/council-meetings`), police (`/police`), council accountability (`/campaign-finance`), city budget (`/city-budget`). Caddy obtains and renews Let's Encrypt certificates automatically; cert data lives in the `caddy_data` volume.

## Custom domain (done)

| Record | Type | Value |
|--------|------|--------|
| `@` | A | `168.231.65.105` |
| `www` | CNAME | `ganciatx.com` |

DNS was updated via Hostinger (removed old parking IP `2.57.91.91`). Propagation can take up to ~5 minutes (TTL 300).

**HTTPS:** Caddy in `docker-compose.yml` terminates TLS for `ganciatx.com` and `www`. Ensure VPS firewall allows **443/tcp** (and **80/tcp** for ACME + redirect). Set `ACME_EMAIL` in `.env` for Let's Encrypt account contact.

## Acceptance criteria

1. Website exists on Hostinger account. ✅
2. `docker compose up` builds and serves the dashboard on port 80. ✅
3. VPS receives deploy via Docker Manager / GitHub. ✅
4. Production has scraper disabled by default; maps/finance/voting work. ✅

## Files

| Path | Role |
|------|------|
| `Dockerfile` | Production image |
| `docker-compose.yml` | Caddy + sivic stack |
| `deploy/caddy/Caddyfile` | TLS, reverse proxy, security headers |
| `.github/workflows/deploy-hostinger.yml` | Auto deploy |
| `HOSTINGER_DEPLOY_PLAN.md` | This plan |
| `deploy/hostinger-landing/` | Static placeholder site |
