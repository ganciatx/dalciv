# Tax Identity Shield — Booth Demo

Trade-show kiosk demo at **`/breach-check`** on the dashboard.

## Run locally

**Terminal 1** — start the dashboard (default port **8765**, not 8000):

```bash
cd "/path/to/Sivic Scraper"
python -m dashboard
```

**Terminal 2** — open in Brave kiosk:

```bash
chmod +x scripts/launch-tax-identity-shield-kiosk.sh
./scripts/launch-tax-identity-shield-kiosk.sh
```

Or manually:

```bash
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  --kiosk "http://127.0.0.1:8765/breach-check"
```

## Important

- Use **`http://127.0.0.1:8765/breach-check`** — the FastAPI route that serves the app.
- Do **not** open `dashboard/static/breach-check/index.html` directly; assets will not load.
- Rebuild after UI changes: `cd breach-check && npm run build`

## Booth controls

| Input | Action |
|-------|--------|
| Mouse move / click | Wake interactive demo |
| 1 min idle | Return to attract screen |
| Esc | Toggle attract ↔ interactive |
| Shift+Esc | Exit fullscreen |
