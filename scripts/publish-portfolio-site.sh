#!/usr/bin/env bash
# Rebuild portfolio static export into dashboard/static/portfolio-site/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/portfolio"
npm run publish-site
echo ""
echo "Portfolio published. Restart the dashboard to serve changes at /"
