# Hostinger Deploy Plan — Tally

**Overall Progress:** `0%`

## TLDR

Deploy **Tally** (Vite + React SPA, client-only localStorage) at **`https://tally.ganciatx.com`**. Use the existing Hostinger VPS + Caddy stack that already serves **`https://ganciatx.com`** (DalCiv portal). Tally is static files only — no Node server, database, or auth in production.

**Recommended URL:** `tally.ganciatx.com` (not `ganciatx.com/tally`).

## Subdomain vs path — use the subdomain

| | `tally.ganciatx.com` ✅ | `ganciatx.com/tally` |
|---|---|---|
| Vite config | Default (`base: '/'`) | Requires `base: '/tally/'` |
| React Router | Default `BrowserRouter` | Requires `basename="/tally"` |
| DalCiv conflicts | None | Competes with existing top-level routes (`/`, `/police`, `/city-budget`, …) |
| SPA fallback | One Caddy `file_server` block | Split routing: Caddy must serve `/tally*` before proxying everything else to DalCiv |
| Asset URLs | Just work | Easy to break on refresh/deep links |
| Matches existing pattern | Same as `frames.ganciatx.com` | One-off special case |

**Verdict:** Subdomain is cleaner, less code, fewer moving parts, and matches how you already deploy other apps on this domain.

## Critical decisions

- **Subdomain + static hosting** — `npm run build` → upload `dist/`; Caddy serves files and falls back to `index.html` for React Router.
- **Same VPS as DalCiv** — DNS A record `tally` → VPS IP (same as `ganciatx.com`, e.g. `168.231.65.105`). Extend the existing Caddyfile; do not bind a second project to ports 80/443.
- **No backend in v1** — Scores live in the browser (`localStorage`). No env vars required for production.
- **Optional portal link** — Add a card on the DalCiv home page pointing to `https://tally.ganciatx.com` (external link, new tab). DalCiv routes stay unchanged.
- **Deploy artifact** — Ship the **`dist/`** folder after build, not source. Rebuild on every release (`npm run build`).

## App specifics (this repo)

| Item | Value |
|------|--------|
| Build command | `npm ci && npm run build` |
| Output | `dist/` (HTML, JS, CSS) |
| Router | React Router `BrowserRouter` — routes: `/`, `/pick-game`, `/setup/:gameId`, `/game`, `/history` |
| Runtime deps | None (static SPA) |
| Secrets | None |

## Tasks

- [ ] 🟥 **Step 1: Production build check (local)**
  - [ ] 🟥 Run `npm ci && npm run build` — confirm `dist/` is created with no errors
  - [ ] 🟥 Run `npm run preview` and smoke-test: landing → setup → game → history → refresh on `/game` (must not 404)
  - [ ] 🟥 Confirm no hard-coded localhost URLs in source

- [ ] 🟥 **Step 2: DNS for subdomain**
  - [ ] 🟥 In Hostinger DNS for `ganciatx.com`, add **A record** `tally` → VPS IP (same as root `@` / `www`)
  - [ ] 🟥 Confirm propagation: `dig tally.ganciatx.com +short`
  - [ ] 🟥 Wait for DNS before expecting Caddy to issue TLS for `tally.ganciatx.com`

- [ ] 🟥 **Step 3: Static files on VPS**
  - [ ] 🟥 Choose deploy path on VPS, e.g. `/srv/tally` (or a Docker volume mounted into Caddy)
  - [ ] 🟥 Upload `dist/` contents after each build:
    ```bash
    npm run build
    rsync -avz --delete dist/ user@168.231.65.105:/srv/tally/
    ```
  - [ ] 🟥 Alternatively: add a `tally` service to DalCiv `docker-compose.yml` using `nginx:alpine` with `dist/` copied into the image (only if you want deploy tied to the DalCiv repo pipeline)

- [ ] 🟥 **Step 4: Caddy routing (recommended)**
  - [ ] 🟥 Add to `deploy/caddy/Caddyfile` (adjust root path to match Step 3):

    ```caddyfile
    tally.ganciatx.com {
        root * /srv/tally
        encode gzip zstd
        header {
            X-Content-Type-Options nosniff
            X-Frame-Options SAMEORIGIN
            Referrer-Policy strict-origin-when-cross-origin
        }
        try_files {path} /index.html
        file_server
    }
    ```

  - [ ] 🟥 Leave existing `ganciatx.com, www.ganciatx.com` block unchanged (`reverse_proxy sivic:8765`)
  - [ ] 🟥 Reload Caddy / redeploy the `dalciv` Docker stack (full rebuild if Caddyfile is baked into the image)

- [ ] 🟥 **Step 5: Optional DalCiv portal link**
  - [ ] 🟥 Add card to `dashboard/templates/home.html`: label **Tally**, href `https://tally.ganciatx.com`, `target="_blank"`
  - [ ] 🟥 Do not change existing card hrefs or DalCiv routes

- [ ] 🟥 **Step 6: First deploy & verify**
  - [ ] 🟥 Build locally, rsync `dist/` to VPS
  - [ ] 🟥 `https://tally.ganciatx.com/` — landing loads over HTTPS
  - [ ] 🟥 Deep links work: `/setup/yahtzee`, `/game`, `/history` (refresh each — no 404)
  - [ ] 🟥 Start a game, refresh mid-game — session resumes from localStorage
  - [ ] 🟥 Mobile viewport OK (primary use case)
  - [ ] 🟥 `https://ganciatx.com/` — DalCiv portal still loads; other apps unaffected

- [ ] 🟥 **Step 7: Repeatable deploy workflow**
  - [ ] 🟥 Document one-liner in repo (see below) or add GitHub Action on push to `main` that builds and rsyncs `dist/`
  - [ ] 🟥 Version tag releases if you want rollback (`dist/` backup on VPS before `--delete` rsync)

## Alternative: Hostinger shared hosting (no VPS changes)

Use this only if you prefer Hostinger’s hosting panel over the VPS Caddy stack.

1. Create subdomain **`tally.ganciatx.com`** in Hostinger → Websites → Subdomains.
2. **Option A — static upload:** `npm run build`, zip `dist/`, deploy via Hostinger static deploy. Add Apache SPA rules if deep links 404:

   ```apache
   # public_html/.htaccess (if on Apache)
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

3. **Option B — Node build on Hostinger:** Zip source (no `node_modules`), use Hostinger JS deploy; set build command `npm ci && npm run build` and output/public dir `dist`.

**Still use the subdomain** — path-prefix hosting on the main site account is the same hassle as the VPS path option.

## If you insist on `ganciatx.com/tally` (not recommended)

Only do this if a subdomain is impossible. Required code changes in **this repo**:

1. `vite.config.ts` — `base: '/tally/'`
2. `src/main.tsx` — `<BrowserRouter basename="/tally">`
3. Caddy on `ganciatx.com` — handle `/tally*` **before** `reverse_proxy sivic:8765`:

   ```caddyfile
   ganciatx.com, www.ganciatx.com {
       handle_path /tally* {
           root * /srv/tally
           try_files {path} /index.html
           file_server
       }
       handle {
           reverse_proxy sivic:8765
       }
   }
   ```

4. Re-test every route and asset after each deploy.

## Quick deploy cheat sheet

```bash
# From this repo root
npm ci
npm run build

# Upload to VPS (replace user/host/path)
rsync -avz --delete dist/ USER@168.231.65.105:/srv/tally/
```

Public URL after DNS + Caddy: **https://tally.ganciatx.com**

## Out of scope (v1)

- Server-side score sync / accounts
- Custom domain beyond `tally.ganciatx.com`
- CI/CD automation (optional Step 7)
- Path-prefix deploy at `ganciatx.com/tally`
