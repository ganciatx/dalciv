# City Budget Simulator — Technical Specification

**Version:** 0.1 (Concept)
**Document Type:** Game Design & Technical Specification

---

## 1. Overview

City Budget Simulator is a turn-based web game in which the player governs a mid-sized American city over a 30-year horizon. The core loop is: make budget and policy decisions → watch delayed consequences propagate across interconnected systems → manage citizen political reactions → avoid fiscal collapse or electoral defeat.

The game is explicitly educational, designed to build intuition for concepts like deferred maintenance, tax incidence, pension math, and debt dynamics — while remaining engaging and replayable.

**Target Player:** Civic-minded adults, students of urban policy, local government professionals, and anyone curious about why cities struggle to balance books. Think "city budget nerd meets Dwarf Fortress light."

**Platform:** Browser-based (React + Canvas or pure React). No install required. Desktop-first, tablet-friendly.

**Session Length:** 20–45 minutes per campaign. Shorter sandbox mode available.

---

## 2. Core Design Philosophy

### The Delay Principle
Every consequential decision has a delayed effect. This is the game's central mechanic and educational insight:

| Decision | Primary Effect | Delayed Effect | Lag |
|---|---|---|---|
| Cut road maintenance | Save $4M/yr | Road failure rate rises, emergency repair costs spike | 8–12 years |
| Raise property taxes | +$12M/yr | Slowed development reduces future tax base growth | 3–7 years |
| Defer pension contributions | Save $8M/yr | Unfunded liability grows, future required payments balloon | 10–20 years |
| Hire more police | +$6M/yr cost | Crime falls, property values rise, tax base grows | 2–4 years |
| Approve dense zoning | Upfront political cost | Housing supply rises, affordability improves, tax base grows | 5–10 years |

The delay system is what makes the game hard and meaningful. Players who optimize for the current year will almost always fail by year 20.

### Legibility Over Complexity
Every number the player sees must be explainable in one sentence. No hidden multipliers. If a policy has a delayed consequence, the game shows it as a pending event on a timeline — players can see the grenade they just threw, even if it hasn't exploded yet.

---

## 3. Game Systems

### 3.1 Budget System

The city operates on an annual fiscal year. Each turn = 1 year.

**Revenue Sources**
- Property tax (rate × assessed value of tax base)
- Sales tax (rate × consumer spending proxy)
- State/federal transfers (semi-fixed, with policy-triggered changes)
- Fees & charges (park fees, permits, fines)
- Debt issuance (bonds — increases future obligations)

**Expenditure Categories**
- Public safety (police + fire staffing levels)
- Infrastructure maintenance (roads, water, sewer)
- Debt service (principal + interest on outstanding bonds)
- Pension contributions (required vs. actual — player can underpay)
- Parks & libraries (quality-of-life services)
- Administration

**Balance Requirement**
The city must not run a cash deficit. However, the player can:
- Issue bonds to cover capital costs
- Defer pension contributions (up to a legal threshold)
- Draw down a rainy day fund (if it exists)

A structural deficit (spending > revenue for 3+ consecutive years) triggers a credit downgrade, raising borrowing costs.

---

### 3.2 Tax Base System

The property tax base is the city's economic heart. It is modeled as a collection of zones:

- **Residential** (low/medium/high density)
- **Commercial** (retail, office)
- **Industrial**

Each zone has:
- Current assessed value
- Annual growth rate (affected by city quality signals)
- Development pressure (demand waiting to be built)

**Factors that raise the tax base:**
- Good schools (state-funded but city-influenced)
- Low crime
- Good infrastructure condition
- Housing affordability (attracts workers)
- Favorable zoning

**Factors that suppress the tax base:**
- High property tax rates (above a threshold)
- Poor road/infrastructure condition
- High crime
- Poor affordability (workers leave)
- Zoning restrictions (prevents development from being built)

Tax base changes are lagged 2–5 years after the causal factor. The player sees leading indicators (construction permits issued, population trend) before the tax base actually shifts.

---

### 3.3 Infrastructure Decay System

All infrastructure assets have:
- **Current condition score** (0–100)
- **Decay rate** (points lost per year without maintenance)
- **Minimum safe threshold** (below which failures occur)
- **Maintenance cost** (annual spend to hold condition steady)
- **Failure cost** (emergency repair, much higher than maintenance)

Infrastructure categories:
- Roads (surface + subsurface)
- Water/sewer systems
- Public buildings
- Bridges

**The maintenance trap:** The politically easy move is to cut maintenance — citizens don't notice for years. But condition scores decline silently. When a road or pipe crosses a failure threshold, the city faces a sudden large emergency expenditure that can't be deferred, often 3–5× the cumulative maintenance savings.

A **Deferred Maintenance Liability** meter is visible on the dashboard, showing the total cost of bringing all assets to good condition. It is a slow-moving but alarming number.

---

### 3.4 Pension System

Pensions are the most complex — and most realistic — system in the game.

**Components:**
- **Employees covered:** Retirees (fixed obligation), current workers (accruing new benefits), future hires
- **Assumed rate of return:** The pension fund's investment assumption (default 7%). Player can adjust this — higher assumptions look better on paper but increase risk.
- **Funded ratio:** (Assets / Liabilities). Below 60% = critical; below 40% = state intervention risk.
- **Annual required contribution (ARC):** Actuarially calculated. Player can pay less; the difference compounds.

**The pension spiral:** Underpaying the ARC causes the funded ratio to drop. A lower funded ratio requires a higher ARC next year. This is self-reinforcing. Players who skip pension payments early find themselves locked into catastrophically large required contributions a decade later.

**Reform options (with political costs):**
- Close defined-benefit plan to new hires (big union opposition)
- Increase employee contribution rates (moderate opposition)
- Adjust COLA formula (retiree opposition)
- Issue pension obligation bonds (risky — leverages returns)

---

### 3.5 Public Safety System

Police and fire are modeled together with key metrics:

- **Staffing level** (officers/firefighters per 1,000 residents)
- **Response time** (affected by staffing and station locations)
- **Crime rate** (lagged response to staffing + housing affordability + unemployment)
- **Fire loss rate**

**Trade-offs:**
- Public safety is the city's largest discretionary budget item
- Cuts → slower response times → higher crime (3–5 year lag) → lower property values → lower tax base
- Overstaffing is expensive and politically awkward if the city has poor services elsewhere
- Deferred equipment replacement (vehicles, gear) creates hidden liability similar to infrastructure

---

### 3.6 Housing Affordability System

Housing affordability is measured as median rent / median household income. Above 30% = stress; above 50% = crisis.

**Levers:**
- Zoning reform (allow denser construction — takes 3–7 years to show supply effect)
- Inclusionary zoning (requires % affordable units in new developments — reduces construction pace)
- Direct subsidy programs (expensive, small-scale impact)
- Rent control (immediate relief, long-term supply reduction)

**Effects of affordability on other systems:**
- Unaffordable city → workers leave → labor shortage → slower economic growth → lower sales tax revenue
- Unaffordable city → lower-income workers priced out → potential crime increase
- Affordable city → attracts younger workers → growing population → tax base grows

---

### 3.7 Debt & Credit Rating System

**Bond issuance:** Player can issue general obligation bonds or revenue bonds for capital projects.

**Credit rating** (AAA → AA → A → BBB → junk): Determined by:
- Debt service as % of revenues (above 15% = warning)
- Fund balance (rainy day fund level)
- Pension funded ratio
- 3-year revenue trend

**Credit rating effects:**
- Better rating → lower interest rates on new debt (compound savings)
- Junk rating → some bondholders refuse to buy → city faces liquidity crisis

A **fiscal crisis** event (triggered by cash shortfall + junk rating) forces state intervention — the player loses budget autonomy for 3 years, a near-loss condition.

---

### 3.8 Political System

Citizens organize into **political factions**, each with priorities and approval ratings:

| Faction | Core Priorities | Triggered By |
|---|---|---|
| Homeowners | Low taxes, good roads, safety | Tax hikes, road quality |
| Renters | Affordability, transit, parks | Rent increases, service cuts |
| Business community | Low business taxes, infrastructure | Tax rates, road conditions |
| Public employees | Wages, pensions, staffing | Cuts to workforce/benefits |
| Fiscal hawks | Balanced budget, low debt | Deficits, bond issuance |

**Approval → Election:** Every 4 years, the player faces a re-election event. Each faction casts votes weighted by their size and approval rating. Lose the election = game over (or player chooses a successor with different priorities).

**Approval drivers:** Factions react to outcomes, not intentions. Roads getting worse? Homeowners lose faith. Pension reform? Employees revolt. Affordability crisis? Renters organize.

Importantly, factions react to lagged effects — they notice when roads start failing, not when you cut the maintenance budget 8 years ago.

---

## 4. Simulation Engine

### 4.1 Tick Model

Each year-turn runs a simulation tick in this order:

1. Player submits budget decisions
2. Revenue calculated (tax rates × current tax base)
3. Expenditures processed
4. Fund balance updated
5. Pending delayed events ticked forward (each event has a countdown)
6. Triggered events fire (condition thresholds crossed, timers expired)
7. All system state updated (infrastructure conditions, pension funded ratio, crime rate, etc.)
8. Tax base updated (lagged response to prior-year quality signals)
9. Political approval updated
10. UI receives updated state

### 4.2 Delayed Event Queue

The game maintains an explicit **event queue** — a list of future consequences with countdown timers. This is both a simulation mechanism and a UI feature.

```
Event Queue (visible to player):
[Year +6]  Road condition in District 3 will cross failure threshold → $18M emergency repair
[Year +3]  Property tax increase will begin suppressing commercial development
[Year +12] Pension contribution shortfall compounds → ARC rises to $42M/yr
[Year +2]  New apartment complex delivers 400 units → affordability improves
```

Players can see the grenades they've thrown. They can sometimes defuse them (resume maintenance spending, pay down pension shortfall), but often they must simply plan around them.

### 4.3 Randomness & Events

Beyond the deterministic delay system, random events occur:

- **Economic recession** (reduces sales tax revenue, suppresses development)
- **Natural disaster** (infrastructure damage, emergency costs)
- **State budget crisis** (intergovernmental transfers cut)
- **Interest rate spike** (raises future borrowing costs)
- **Population boom** (good problem — strains services, grows tax base)

Event severity scales with how prepared the city is (rainy day fund size, infrastructure condition, etc.).

---

## 5. User Interface

### 5.1 Primary Views

**Dashboard (default)**
- City skyline silhouette that visually degrades with conditions (crumbling roads, dark neighborhoods)
- Current year, fund balance, credit rating, approval rating
- Key metric tiles: Tax Base, Infrastructure Health, Pension Funded Ratio, Housing Affordability Index, Crime Rate
- Alert banner for urgent issues

**Budget Editor**
- Side-by-side revenue and expenditure columns
- Sliders/inputs for each line item
- Real-time balance calculator
- "Consequences Preview" panel showing immediate and projected delayed effects

**Systems Deep Dive**
- Tabbed view for each major system (Infrastructure, Pensions, Housing, etc.)
- Time-series charts showing 10-year history and 10-year projection
- Condition maps for infrastructure

**Event Timeline**
- Gantt-style view of pending delayed events
- Color-coded by severity (green → yellow → red)
- Player can click any event to see what caused it and what would defuse it

**Political Panel**
- Faction approval ratings with trend arrows
- Next election countdown
- Current coalition math (can you win?)

### 5.2 Feedback Principles

- **Never surprise the player.** If a consequence is coming, show it on the event timeline.
- **Show the "why."** Every metric change has a tooltip explaining what drove it.
- **The newspaper test.** After each turn, a simulated newspaper headline summarizes what happened. ("Road failures cost city $22M — residents furious." / "New apartments ease rent pressure.")
- **Progress indicators.** Long-delayed consequences have progress bars filling toward their trigger.

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 | Component model suits complex state UI |
| State management | Zustand | Lightweight, sufficient for game state |
| Simulation engine | Pure TypeScript module | Isolated, testable, no UI dependencies |
| Charts | Recharts | Good React integration |
| Styling | Tailwind CSS | Rapid iteration |
| Canvas (optional) | HTML5 Canvas | City skyline visualization |
| Build | Vite | Fast dev cycle |
| Hosting | Static (Vercel/Netlify) | No backend needed |

### 6.2 Data Model (Simplified)

```typescript
interface GameState {
  year: number;
  city: CityProfile;          // Name, population, starting conditions
  budget: BudgetState;        // Revenue, expenditures, fund balance
  systems: SystemsState;      // Infrastructure, pensions, housing, safety
  taxBase: TaxBaseState;      // Zones, values, growth rates
  politics: PoliticsState;    // Faction approvals, election timer
  eventQueue: DelayedEvent[]; // Pending future consequences
  history: YearRecord[];      // Full history for charts
}

interface DelayedEvent {
  id: string;
  triggerYear: number;
  category: 'infrastructure' | 'pension' | 'housing' | 'economic' | 'political';
  description: string;
  fiscalImpact: number;        // Positive = cost, negative = savings
  canBeMitigated: boolean;
  mitigationCondition?: string;
}

interface YearRecord {
  year: number;
  revenue: number;
  expenditures: number;
  fundBalance: number;
  taxBase: number;
  pensionFundedRatio: number;
  infrastructureCondition: number;
  housingAffordabilityIndex: number;
  crimeRate: number;
  approvals: Record<FactionId, number>;
  headline: string;
}
```

### 6.3 Simulation Module

The simulation runs entirely client-side as a deterministic function:

```
simulateTurn(state: GameState, decisions: PlayerDecisions) → GameState
```

This is pure (no side effects), making it:
- Easy to unit test
- Possible to run lookahead simulations ("what happens if I do X?")
- Saveable/loadable via JSON serialization

---

## 7. Scenarios & Starting Conditions

The game ships with preset scenarios (real-world inspired, not legally specific):

| Scenario | Description | Key Challenge |
|---|---|---|
| **Sun Belt Boom** | Fast-growing Sunbelt city (Dallas-adjacent) | Infrastructure keeping pace with growth; affordability crisis emerging |
| **Rust Belt Reckoning** | Shrinking industrial city | Declining tax base + legacy pension obligations |
| **Coastal Squeeze** | High-cost city with housing crisis | Affordability + workforce retention |
| **Fiscal Precipice** | City already in distress, junk-rated | Crisis management, state oversight |
| **Greenfield** | Brand new city | Pure planning and optimization |

The Sun Belt Boom scenario is the recommended starting scenario, modeled loosely on the dynamics familiar to Dallas-area observers: rapid growth, infrastructure strain, affordability pressures emerging, relatively lower legacy pension burden than Rust Belt peers.

---

## 8. Win/Loss Conditions

**Loss conditions:**
- Fiscal crisis (cash insolvency)
- Credit rating hits junk + no ability to issue debt (liquidity trap)
- Lost election with no recovery (depends on mode)
- State takeover (triggered by severe fiscal + operational failure)

**Win condition:**
The game doesn't have a single "win" — it has a **30-year grade** across dimensions:

- Fiscal sustainability (pension ratio, debt levels, fund balance)
- Infrastructure quality
- Affordability
- Public safety outcomes
- Economic growth
- Political stability

This produces a scorecard and a brief narrative of what the city became under your stewardship.

---

## 9. Educational Layer

Optional "Policy Explainer" mode that can be toggled on:

- When making a decision, a sidebar shows a real-world parallel (e.g., "Chicago's pension crisis," "Detroit's deferred maintenance story," "Minneapolis's upzoning results")
- After major events fire, a short explanation of the underlying mechanism
- End-of-game summary explains which real fiscal concepts drove the player's outcome

This is opt-in, so it doesn't interrupt experienced players.

---

## 10. Development Phases

### Phase 1 — Playable Prototype (6–8 weeks)
- Core budget loop
- Infrastructure decay system
- Basic political approval
- Turn-based UI (no animation)
- One scenario (Sun Belt Boom)

### Phase 2 — Full Systems (8–10 weeks)
- Pension system
- Housing affordability system
- Credit rating & debt system
- Event queue UI
- All five scenarios
- Newspaper headline generator

### Phase 3 — Polish & Education (4–6 weeks)
- City skyline visualization
- Charts and historical view
- Policy Explainer mode
- Difficulty settings
- Save/load game state

---

## 11. Open Design Questions

1. **Turn length:** Should each turn be 1 year (detailed, slow) or 2 years (faster but less granular)? Recommend 1 year for realism, with a "fast forward" option.

2. **Zoning granularity:** Should the map be a real grid or abstracted into district-level zones? A district model is simpler to build and just as educational.

3. **Multiplayer:** Could add an asynchronous "compare with friends" mode — same scenario, different decisions, compare outcomes at year 30. Low priority but high engagement potential.

4. **Dallas as a named city:** Could release a "Dallas Edition" with historically accurate starting conditions (2025 budget, DART situation, pension details, housing market) for maximum local relevance and press interest.

5. **Mobile:** Touch-friendly budget sliders and simplified layout would make mobile viable in Phase 3.

---

*This spec is a living document. The simulation model should be built first, separate from the UI, and tested independently before any interface work begins.*
