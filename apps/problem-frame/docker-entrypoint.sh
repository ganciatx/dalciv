#!/bin/sh
# Apply pending SQLite migrations to the mounted data volume, then hand off to
# the container command (the Next.js standalone server).
set -e

echo "[entrypoint] running database migrations..."
node scripts/migrate.mjs

exec "$@"
