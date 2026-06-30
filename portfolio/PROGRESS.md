# Portfolio Build Progress

**Overall Progress: 100%**

| Step | Task | Status |
|------|------|--------|
| 1 | Scaffold Next.js project | ✅ Complete |
| 2 | Content layer (config, apps, blog) | ✅ Complete |
| 3 | Landing page | ✅ Complete |
| 4 | Apps & blog pages | ✅ Complete |
| 5 | Layout, nav, footer, styling | ✅ Complete |
| 6 | Build verification | ✅ Complete |
| 7 | Static export + FastAPI root | ✅ Complete |
| 8 | DalCiv apps as side projects | ✅ Complete |

## What's Built

- **Landing page** (`/`) — Hero, services grid, featured side projects, latest blog posts, contact CTA
- **Side projects** (`/apps`) — DalCiv civic tools with on-site links; Tally opens externally
- **Blog** (`/blog`) — Post index with category tags and dates
- **Blog posts** (`/blog/[slug]`) — Markdown-powered articles with static generation
- **Legacy portal** (`/dalciv`) — Previous DalCiv app grid for direct bookmarks

## Deploy

```bash
cd portfolio && npm run publish-site   # exports to dashboard/static/portfolio-site/
python -m dashboard             # serves portfolio at /
```

Or from repo root: `./scripts/publish-portfolio-site.sh`

Docker production build runs the portfolio step automatically (see root `Dockerfile`).

## Customize

1. Edit `content/site.yaml` — name, bio, email, social links, section headings, services, and apps
2. Add blog posts as `.md` files in `content/blog/` with frontmatter
3. Run `npm run dev` in `portfolio/` to preview Next.js locally on port 3000
4. Run `npm run publish-site` to update what the dashboard serves at `/`
