# Portfolio

A personal portfolio website with a landing page, blog, and apps catalog. Built with Next.js, inspired by product manager portfolios like [Sam Dickie](https://www.samdickie.me/) and [Ben Solomon](https://www.bensol.me/).

## Features

- **Landing page** — Bold hero intro, expertise grid, featured apps, latest blog posts, contact CTA
- **Apps catalog** (`/apps`) — Showcase all your products with tags and direct links
- **Blog** (`/blog`) — Markdown-powered posts with categories, dates, and static generation
- **Fully customizable** — All content lives in config files and markdown, no code changes needed

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customization

### Site copy (hero, services, apps, section headings)

Edit **`content/site.yaml`** — see [`content/SITE_CONTENT_GUIDE.md`](content/SITE_CONTENT_GUIDE.md).

```bash
npm run dev            # preview at localhost:3000
npm run publish-site   # rebuild + sync to dashboard/static/portfolio-site/
```

From the repo root: `./scripts/publish-portfolio-site.sh`

### Blog posts

Add markdown files to `content/blog/` with frontmatter:

```markdown
---
title: "Your post title"
excerpt: "Short summary for cards and SEO"
date: "2025-12-01"
category: "How to"
emoji: "📝"
---

Your content here...
```

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, static generation)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [gray-matter](https://github.com/jonschlinkert/gray-matter) + [react-markdown](https://github.com/remarkjs/react-markdown) for blog content

## Deploy

Deploy to [Vercel](https://vercel.com/) or any platform that supports Next.js:

```bash
npm run build
npm start
```
