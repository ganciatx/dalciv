#!/usr/bin/env bash
# Run council accountability test suite (frontend unit + backend + E2E).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PYTHONPATH="$ROOT"

echo "==> Frontend unit tests (vitest)"
(cd council-accountability && npm test)

echo "==> Backend unit + API tests"
python3 -m pytest tests/ -v -m "not e2e"

echo "==> Browser E2E tests (Playwright)"
python3 -m pytest tests/test_council_accountability_e2e.py -v -m e2e

echo "All council accountability tests passed."
