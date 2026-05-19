# How to update the live website

A plain-language guide for publishing changes after you edit the project in Cursor.

---

## The big picture

Your project lives in **two places**:

| Place | What it is | Who can see it |
|-------|------------|----------------|
| **Your computer** (this folder) | Where you edit code with Cursor | Only you |
| **Hostinger** (online server) | Where the public site runs | Anyone with the link |

**Deploying** means copying your latest work from your computer to Hostinger so visitors see the update.

```text
  You edit in Cursor  →  Test on your computer  →  Send to GitHub  →  Hostinger updates the live site
```

---

## Two different online sites (don’t mix them up)

| Site | Address (example) | What runs there |
|------|-------------------|-----------------|
| **Landing page** | `mediumturquoise-giraffe-322901.hostingersite.com` | A simple info page only (not the full dashboard) |
| **Live app** | **[http://ganciatx.com/](http://ganciatx.com/)** | The real dashboard: police map, council finance, voting, Legistar UI |

Most changes you make in this project affect the **live app on the VPS**, not the small landing page.

---

## What “version” means here

We don’t use a fancy version number on the website itself. Instead:

1. **CHANGELOG.md** — A short list of what changed and when (for you and anyone helping you). Add a line when you ship something meaningful.
2. **Git commits** — Each time you save the project to GitHub, that snapshot is a “version” you can go back to.
3. **Date on the server** — After deploy, the live site simply runs whatever code was last deployed.

**Simple habit:** When you publish an update, add one bullet under `## Unreleased` in `CHANGELOG.md`, then move those bullets to a dated section when you’re done (e.g. `## 2026-05-20`).

---

## What happens to live data when you deploy?

**Good news:** Normal deploys **do not erase** cached data on the server.

These stay on the VPS between updates (unless you delete them on purpose):

- Police map geocode cache  
- Campaign finance cache  
- Council voting cache (~189k rows — first build can take several minutes)  
- Downloaded PDFs and summaries (if you use the Legistar scraper on the server)

**Code updates** (pages, colors, filters, bug fixes) are replaced. **Data folders** are stored in Docker “volumes” and are kept.

---

## Before you deploy: test on your computer

Always check locally first so you don’t push a broken site live.

1. Open Terminal in the project folder.
2. Start the app:
   ```bash
   source .venv/bin/activate   # if you use a virtual environment
   python -m dashboard
   ```
3. In your browser, open:
   - http://127.0.0.1:8765 — app portal
   - http://127.0.0.1:8765/council-meetings — Legistar dashboard  
   - http://127.0.0.1:8765/police — Police map  
   - http://127.0.0.1:8765/campaign-finance — Council accountability  
4. Click through what you changed. Fix issues **before** deploying.

Your computer uses `127.0.0.1` — that address only works on your machine, not for the public.

---

## How to publish changes (recommended: GitHub)

This is the easiest path once setup is done.

### One-time setup (do once)

1. Put the project on **GitHub** (private repo is fine).
2. Buy a **Hostinger VPS** (see below — **KVM 2**, **Ubuntu 24.04**, **Plain OS** tab).
3. In GitHub → **Settings → Secrets and variables → Actions**:
   - Secret: `HOSTINGER_API_KEY` — from [Hostinger API settings](https://hpanel.hostinger.com/profile/api)
   - Variable: `HOSTINGER_VM_ID` — your VPS number (from hPanel URL, e.g. `123456` in `.../vps/123456/...`)
4. First deploy: in GitHub → **Actions** → **Deploy to Hostinger VPS** → **Run workflow**, or push to the `main` branch.

### Every time you change the site

1. **Edit** in Cursor (same as you do now).
2. **Test locally** (`python -m dashboard` — see above).
3. **Save to GitHub:**
   - In Cursor: Source Control → write a short message (e.g. “Fix voting filter”) → **Commit** → **Push**
   - Or ask Cursor: “commit and push my changes”
4. **Wait for deploy** (about 5–15 minutes the first time, often faster after):
   - GitHub → **Actions** → open the latest **Deploy to Hostinger VPS** run  
   - Green checkmark = live site updated  
   - Red X = something failed (open the log or ask for help)
5. **Check the live site** — open your VPS URL in a browser and hard-refresh (`Cmd+Shift+R` on Mac).

You do **not** need to re-upload files by hand if GitHub deploy is working.

---

## Alternative: update the server yourself (SSH)

Use this if GitHub Actions isn’t set up or you prefer manual control.

1. Log in to the VPS with SSH (credentials in Hostinger hPanel).
2. Go to the project folder, e.g. `cd ~/sivic-scraper`
3. Pull latest code and rebuild:
   ```bash
   git pull
   docker compose up -d --build
   ```
4. Check status:
   ```bash
   docker compose ps
   ```

The site may be unavailable for **1–3 minutes** during rebuild.

---

## Updating only the small landing page

If you only changed `deploy/hostinger-landing/index.html` (not the main app):

1. Edit the file in Cursor.
2. Zip **only** `index.html` at the root of the zip (not inside a subfolder).
3. In Hostinger hPanel → your website → **File Manager** → `public_html` — upload and replace, **or** use Hostinger’s static deploy tool.

The full dashboard still lives on the **VPS**, not on this landing subdomain.

---

## What kind of change needs what?

| You changed… | Test locally | Deploy via GitHub / Docker | Redeploy landing zip |
|--------------|--------------|----------------------------|----------------------|
| Police map look or behavior | Yes | Yes | No |
| Council finance / voting | Yes | Yes | No |
| Legistar dashboard | Yes | Yes | No |
| Python code or `requirements.txt` | Yes | Yes (rebuild) | No |
| Landing page text only | Optional | No | Yes |
| Server settings (`.env` on VPS) | N/A | Edit on server, restart | No |

If you added a new Python package, deploy **must** rebuild Docker (`docker compose up -d --build` or GitHub Action).

---

## Production safety (what visitors get)

On the live VPS, by default:

- **Police map** and **council accountability** — on  
- **Legistar “Start scrape”** — off (saves server resources and reduces risk)

To turn scraping on on the server, an advanced step is required: set `SCRAPER_ENABLED=1` in the server environment and redeploy. Most people leave it off.

---

## Checklist: “I’m ready to go live with my edits”

- [ ] I tested on http://127.0.0.1:8765  
- [ ] I committed and pushed to GitHub (or ran `git pull` + `docker compose up -d --build` on the VPS)  
- [ ] GitHub Actions shows a green deploy (if using GitHub)  
- [ ] I opened the **VPS URL** (not only the landing page) and checked my change  
- [ ] I added a note to `CHANGELOG.md` if this was a meaningful release  

---

## If something looks wrong after deploy

| Problem | What to try |
|---------|-------------|
| Old page still showing | Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) |
| Site won’t load | GitHub Actions log, or on VPS: `docker compose logs -f` |
| “Start scrape” doesn’t work live | Expected if `SCRAPER_ENABLED=0`; only for local or advanced server config |
| Voting data empty first time | Click **Refresh voting** once; first download can take several minutes |
| Deploy failed on GitHub | Check `HOSTINGER_API_KEY` and `HOSTINGER_VM_ID` are set correctly |

---

## VPS quick reference (first-time setup)

When buying the VPS in Hostinger:

- **Tab:** Plain OS (not the Docker app catalog)  
- **OS:** Ubuntu 24.04 LTS  
- **Plan:** KVM 2 (8 GB RAM) recommended  
- **Location:** US (e.g. Phoenix)  

Technical setup details: **`HOSTINGER_DEPLOY_PLAN.md`**

---

## Where to get help in the project

| File | Purpose |
|------|---------|
| **This guide** | Deploying updates, versioning habits |
| `HOSTINGER_DEPLOY_PLAN.md` | First-time Hostinger + Docker setup |
| `README.md` | Running the app locally, features overview |
| `CHANGELOG.md` | Record of what shipped |

---

*Last updated: May 2026 — matches GitHub Action deploy and Docker setup in this repo.*
