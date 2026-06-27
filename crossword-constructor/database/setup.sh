#!/usr/bin/env bash
# Recreate crossword.db from schema + curated dataset
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="${SCRIPT_DIR}/crossword.db"

# Use small demo seed: ./setup.sh --demo
if [[ "${1:-}" == "--demo" ]]; then
  rm -f "${DB_PATH}"
  sqlite3 "${DB_PATH}" < "${SCRIPT_DIR}/schema.sql"
  python3 "${SCRIPT_DIR}/seed_data.py"
else
  python3 "${SCRIPT_DIR}/load_large_dataset.py"
fi

echo ""
echo "Database ready: ${DB_PATH}"
echo "Open in DB Browser for SQLite, or run: sqlite3 \"${DB_PATH}\""
