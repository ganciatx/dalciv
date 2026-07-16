# Production image for Problem Frame (Next.js standalone + SQLite/Better Auth).
# Built by the DalCiv Docker stack (apps/problem-frame) and served behind Caddy
# at https://frames.ganciatx.com. See ../docs/HOSTINGER_DEPLOY_PLAN.md.

# ── Dependencies (full install; build tools present in case better-sqlite3
#    has no prebuilt binary for this platform) ──────────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ── Build (produces .next/standalone) ───────────────────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* vars are inlined at build time, so the public app URL must be
# known here (overridable via --build-arg for other environments).
ARG NEXT_PUBLIC_APP_URL=https://frames.ganciatx.com
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` imports the auth module, which opens a SQLite handle; give it a
# throwaway data dir so the build doesn't fail. This file is discarded with the layer.
RUN mkdir -p data && npm run build

# ── Runtime (minimal standalone server) ──────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_PATH=/app/data/app.db

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Next.js standalone output + static assets it does not copy automatically.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Migration assets. The traced standalone node_modules may omit the drizzle
# migrator submodule, so copy the full packages needed by scripts/migrate.mjs.
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
COPY --from=deps /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=deps /app/node_modules/bindings ./node_modules/bindings
COPY --from=deps /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /app/data \
    && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

# Run migrations against the mounted volume, then start the standalone server.
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
