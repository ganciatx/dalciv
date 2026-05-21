# Home Portal Plan

**Overall Progress:** `100%`

## TLDR

Replace Legistar scraper as site root with a **My Apps**-style portal at `/`. Scraper UI stays at `/council-meetings` (unlisted from portal; linked from `/command` only). Center **DALCIV** logo at top.

## Tasks

- [x] 🟩 **Step 1: Assets** — `dashboard/static/dalciv-logo.png`
- [x] 🟩 **Step 2: Portal template** — `dashboard/templates/home.html` (app grid)
- [x] 🟩 **Step 3: Routes** — `GET /` → home; `GET /council-meetings` → scraper (`index.html`)
- [x] 🟩 **Step 4: Nav links** — index, police, campaign_finance, README
- [x] 🟩 **Step 5: Portal links** — **Council meetings** card → [Dallas Legistar calendar](https://cityofdallas.legistar.com/Calendar.aspx); scraper linked from **`/command`** header only
