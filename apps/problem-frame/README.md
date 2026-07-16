This is **Problem Frame** — a [Next.js](https://nextjs.org) app for product problem statements, personas, evidence, and hypotheses. It uses SQLite, Drizzle, and Better Auth.

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (comes with Node)

## Run the development server

### 1. Install dependencies

From this directory (`web/`):

```bash
npm install
```

### 2. Environment variables

Create a local env file from the example:

```bash
cp .env.example .env.local
```

Set **`BETTER_AUTH_SECRET`** to a long random string (at least 32 characters). For example:

```bash
openssl rand -base64 32
```

Paste the result into `.env.local` as `BETTER_AUTH_SECRET=...`.

For local development, defaults usually work:

- **`BETTER_AUTH_URL`** — `http://localhost:3000` (must match where you open the app)
- **`NEXT_PUBLIC_APP_URL`** — same as above if you use the default port

Optional: **`DATABASE_PATH`** — defaults to `./data/app.db` under `web/` if unset.

### 3. Database migrations

Apply the SQLite schema (creates `data/app.db` on first run):

```bash
npm run db:migrate
```

If you change the Drizzle schema later, generate and apply new migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Start the dev server

```bash
npm run dev
```

By default the app listens on **[http://localhost:3000](http://localhost:3000)**. Open that URL in your browser.

The dev server uses Next.js with **Turbopack** (fast refresh when you edit files under `src/`).

### 5. First-time flow in the app

1. Go to **Register** and create an account.  
2. Create an **organization** when prompted.  
3. Add **products**, **personas**, then **problem frames** from the navigation.

### Troubleshooting

- **Port 3000 in use** — run on another port, for example:  
  `npx next dev --port 3001`  
  Then set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` in `.env.local` to `http://localhost:3001`.
- **Auth or session errors** — confirm `BETTER_AUTH_SECRET` is set (at least 32 characters; the app will not start without it) and `BETTER_AUTH_URL` matches the URL you use in the browser (including port).
- **Database errors after pulling changes** — run `npm run db:migrate` again.

### Other useful commands

| Command | Purpose |
|--------|---------|
| `npm run build` | Production build |
| `npm run start` | Run production server (after `build`) |
| `npm run lint` | ESLint |
| `npm run db:studio` | Open Drizzle Studio against the SQLite file |

## Production deploy

Problem Frame runs in production at **[https://frames.ganciatx.com](https://frames.ganciatx.com)**, built as a Next.js `standalone` Docker image and served behind the shared DalCiv Caddy instance on the Hostinger VPS. SQLite data lives on a named Docker volume mounted at `DATABASE_PATH` (`/app/data/app.db`); the container applies pending Drizzle migrations on startup (`scripts/migrate.mjs`).

Full setup, DNS, and rollout steps are documented in **[`../docs/HOSTINGER_DEPLOY_PLAN.md`](../docs/HOSTINGER_DEPLOY_PLAN.md)**.

To build and run the production image locally:

```bash
docker build -t problem-frame .
docker run --rm -p 3000:3000 \
  -e BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  -v problem_frame_data:/app/data \
  problem-frame
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Better Auth](https://www.better-auth.com/docs)
