# Council member headshots — implementation plan

**Overall Progress:** `100%`

## TLDR

Show councilmember headshots from project **`images/`** on the Council Accountability browse grid and member profile. Browse: photo/card → in-app profile. Profile: photo → Dallas City Hall district page. Active vs former labels; actives sorted by district.

## Tasks

- [x] 🟩 **`dashboard/council_headshots.py`** — roster map (district 1–14), file names, `district_page_url`, `enrich_member_portrait`
- [x] 🟩 **`app.py`** — mount `/council-images` → `images/`
- [x] 🟩 **`council_accountability.py`** — enrich directory + profile API payloads
- [x] 🟩 **`campaign_finance.html`** — browse → profile on photo; profile photo → City Hall; status badges; sort actives by district
- [x] 🟩 **Tests** — `tests/test_council_headshots.py`

## Notes

- **Paula Blackmon (D9)** has no image file yet — initials placeholder + district link when district is known.
- **Paul Ridley** aliases `paul-ridley` / `paul-e-ridley` share D14 headshot.
