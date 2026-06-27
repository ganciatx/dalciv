#!/usr/bin/env bash
# Launch Tax Identity Shield booth demo in Brave kiosk mode.
# Requires the dashboard to already be running: python -m dashboard
set -euo pipefail

PORT="${DASHBOARD_PORT:-8765}"
HOST="${DASHBOARD_HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}/breach-check"

BRAVE_MAC="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
BRAVE_LINUX="/usr/bin/brave-browser"
BRAVE_WIN="/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe"

if ! curl -sf --max-time 2 "${URL}" -o /dev/null; then
  echo "ERROR: Dashboard is not reachable at ${URL}" >&2
  echo "" >&2
  echo "Start it first from the project root:" >&2
  echo "  python -m dashboard" >&2
  echo "" >&2
  echo "Then re-run this script." >&2
  exit 1
fi

KIOSK_FLAGS=(
  --kiosk "${URL}"
  --no-first-run
  --disable-infobars
  --disable-session-crashed-bubble
)

if [[ "$(uname -s)" == "Darwin" && -x "${BRAVE_MAC}" ]]; then
  exec "${BRAVE_MAC}" "${KIOSK_FLAGS[@]}"
elif [[ -x "${BRAVE_LINUX}" ]]; then
  exec "${BRAVE_LINUX}" "${KIOSK_FLAGS[@]}"
elif [[ -f "${BRAVE_WIN}" ]]; then
  exec "${BRAVE_WIN}" "${KIOSK_FLAGS[@]}"
else
  echo "ERROR: Brave Browser not found. Open this URL manually in kiosk mode:" >&2
  echo "  ${URL}" >&2
  exit 1
fi
