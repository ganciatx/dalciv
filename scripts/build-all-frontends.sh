#!/usr/bin/env bash
# Build every frontend package registered in apps/registry.yaml.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

build_pkg() {
  local dir="$1"
  if [[ ! -f "$dir/package.json" ]]; then
    echo "skip $dir (no package.json)" >&2
    return 0
  fi
  echo "==> $dir"
  if [[ -f "$dir/package-lock.json" ]]; then
    (cd "$dir" && npm ci && npm run build)
  else
    (cd "$dir" && npm install && npm run build)
  fi
}

# Portfolio (Next.js static export)
build_pkg portfolio

# Vite SPAs listed in apps/registry.yaml
while IFS= read -r dir; do
  [[ -n "$dir" ]] && build_pkg "$dir"
done < <(python3 -c "
import yaml
from pathlib import Path
reg = yaml.safe_load(Path('apps/registry.yaml').read_text(encoding='utf-8'))
for app in reg.get('apps', []):
    if app.get('type') == 'vite-spa' and app.get('source_dir'):
        print(app['source_dir'])
")

python3 scripts/sync-site-apps.py

echo ""
echo "All frontends built into dashboard/static/"
