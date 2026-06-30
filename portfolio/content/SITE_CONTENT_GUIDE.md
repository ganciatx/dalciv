# Site content guide

All non-blog copy lives in **`content/site.yaml`**. Blog posts stay in `content/blog/*.md`.

## Quick workflow

| Goal | Command |
|------|---------|
| Preview edits live | `npm run dev` → http://localhost:3000 |
| Publish to DalCiv (`/` on the dashboard) | `npm run publish-site` |
| From repo root | `./scripts/publish-portfolio-site.sh` |

`publish-site` rebuilds the Next.js export and copies it to `dashboard/static/portfolio-site/`. Restart the dashboard if it is already running.

## What to edit in `site.yaml`

| Key | Used on |
|-----|---------|
| `site` | Hero, header, footer, meta title/description, contact email |
| `sections.services` | “What I Do” heading and intro (`description` falls back to `site.bio` when empty) |
| `sections.sideProjects` | Featured apps block on the home page |
| `sections.blog` | “Latest Content” block |
| `sections.contact` | Bottom contact CTA |
| `sections.hero` | Hero button labels and link |
| `services` | Expertise cards under “What I Do” |
| `apps` | `/apps` catalog and homepage featured grid (`featured: true`) |

## App fields

- `url` — site-relative (`/police`) or full URL for external tools
- `image` — path under `public/`, e.g. `/apps/timer.png`
- `featured` — `true` shows on the home page
- `external` — optional; auto-detected for `https://` URLs
