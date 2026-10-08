# HeatShift — Product Document

## 1. One-line summary

HeatShift is a mobile-first PWA that converts city-wide heat data into a personal,
actionable work/rest/hydration plan and nearby relief locations for outdoor and gig
workers in India.

## 2. Problem

Indian cities publish heat alerts, but an alert tells a delivery rider nothing about
what to do _right now_ on his tenth floor-to-street drop of the afternoon. The gap
between "the city is hot today" and "you should rest 15 minutes every 45 minutes,
drink 750 ml per hour, and the nearest water point is 400 m away" is where heat
injuries actually happen.

Affected groups:

| Group                | Why they are exposed                                              |
| -------------------- | ----------------------------------------------------------------- |
| Delivery riders      | Continuous sun exposure, back-to-back orders, no scheduled breaks |
| Security guards      | Static posts, often unshaded, long day/night shifts               |
| Construction workers | Peak-afternoon work, heavy physical load, limited on-site water   |
| Street vendors       | Cannot leave stock unattended; self-imposed continuous exposure   |
| Sanitation workers   | Midday routes, direct contact with hot surfaces                   |

None of these workers control their shift. They need a _plan they can execute inside
the shift they already have_, not a warning they cannot act on.

## 3. What HeatShift does

1. **Personal heat-risk score.** Combines weather inputs with work context
   (work type, shift window, water and shade access, acclimatisation) into a 0–100
   score and a four-level classification (low / moderate / high / severe).
2. **Actionable plan.** For the computed risk level, the app returns concrete
   numbers: work minutes per cycle, rest minutes per cycle, water ml per hour,
   a maximum recommended shift length, and a safe start hour.
3. **Nearby relief locations.** A searchable, filterable list of water points,
   shaded areas, clinics, cooling spaces and canteens, ordered by straight-line
   distance from wherever the worker is standing, plotted on a real map.
   **The seeded relief dataset for Delhi is DEMO data.** The map underneath them is
   real; the points on it are not verified against physical sites.
4. **Coordinator view.** Team leads and NGO workers see aggregated check-in status
   (okay / need water / need break / unwell) for the last 24 hours and which relief
   points are still unverified.

## 3.1 What is real, and what is still demo

Reviewers keep asking this, so it is stated once here and mirrored on screen.

| Capability                       | Status          | What that means in practice                                                                                                                   |
| -------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Weather behind the plan          | **Implemented** | Live conditions come from Open-Meteo through our own API. Nothing is simulated, and a provider failure is reported as one — never backfilled. |
| Heat-risk model                  | **Implemented** | The documented WBGT formula in `docs/architecture.md` §6, run in-process for both manual and live paths.                                      |
| Map of relief points             | **Implemented** | A real Mapbox GL base map with pan, zoom and selectable markers, behind a public domain-restricted token.                                     |
| Relief point dataset             | **Demo**        | Seeded Delhi rows. Positions are approximate and most are unverified. A real map layer does not make an entry a place you can find.           |
| Worker identity / authentication | **Not built**   | Mock seeded user IDs. No login, no sessions, no per-user authorisation on any endpoint.                                                       |
| Distances                        | **Computed**    | Haversine from the position the worker granted (or the demo centre), so they are honest as geometry and only as good as the point data.       |
| Offline data                     | **Partial**     | The app shell and route chunks are cached; weather and relief data are network-first and need a connection.                                   |
| Check-in location storage        | **Explicit**    | Coordinates are stored only when the worker sends a check-in that carries them. Browsing with a location never persists it.                   |

The rule the UI follows: anything seeded or demo is labelled on screen, and the live
plan says which provider produced it and when it observed the weather.

## 4. Target users and device reality

- Low-end Android phones (2–4 GB RAM, old Chrome WebView-class browsers).
- Poor or intermittent connectivity; payloads must be small and requests few.
- One-handed use in direct sunlight: high-contrast palette, large tap targets,
  minimal text entry, everything reachable by thumb.
- Language: English first. Hindi copy is planned for the next phase; the UI avoids
  idioms that would not translate.
- Digital literacy varies: the app uses plain labels ("Need water", "Not feeling
  well") instead of icons-only affordances.

## 5. Primary user journeys

### 5.1 Delivery rider (worker)

1. Opens the app before the lunch peak.
2. Taps "Use my location for live heat risk". The browser asks for permission at
   that moment — not on page load — and the app fetches the weather for that spot
   and rebuilds the plan: score, level, and the concrete numbers ("work 25 min /
   rest 35 min, 750 ml water per hour, do not start after 12:00"), labelled with the
   provider and the observation time.
3. Taps one check-in button during the shift ("Okay", "Need water", "Need break",
   "Unwell") — optional location attached if granted.
4. On the relief screen, filters by "Water" and taps the nearest point on the map or
   in the list; both select the same point and show its distance and opening hours.

If the worker denies the location prompt, nothing breaks: the plan keeps working from
the city and shift answers they typed, distances fall back to the demo centre, and the
status chip says so in amber rather than red.

### 5.2 NGO field coordinator

1. Opens the coordinator screen mid-afternoon.
2. Reads the 24-hour team summary: counts per status plus the most recent check-ins.
3. Dispatches water to riders reporting `need_water`; treats `unwell` as an
   escalation trigger.
4. Reviews relief point verification status to plan on-ground verification visits.

## 6. Non-goals (this foundation phase)

Deliberately out of scope, listed so reviewers do not judge the prototype against
them and so the next phase has an explicit backlog:

- **No authentication.** A temporary mock identity (seeded user IDs) is used. No
  passwords, OTPs, or sessions. Every endpoint is open.
- **No AI features.** The risk model is a transparent, documented formula (see
  `docs/architecture.md`), not a learned model.
- **No relief-point verification workflow.** The coordinator screen shows which
  entries are unverified; it does not let anyone confirm one on the ground.
- **No offline data sync.** The PWA shell and route chunks cache for reloads;
  weather and relief data are network-first and writes are online-only.
- **No routing or turn-by-turn directions.** Distances are straight-line, because a
  distance the worker can sanity-check is better than a route we cannot verify.
- **No paid data dependency.** Weather is Open-Meteo, which needs no key. The base
  map uses a Mapbox public token on its free request allowance; without a token the
  app still works and the map area explains itself (see `README.md`).
- **No deployments.** AWS is documented as a target architecture only
  (`docs/aws-deployment-plan.md`, `infra/aws/`). Nothing is deployed in this phase.

## 7. Success criteria for the foundation phase

| Criterion                                | Measure                                                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| End-to-end path works locally            | `docker compose up --build` yields a usable app in one command                                                       |
| Core loop is real, not staged            | Granted location -> our API fetches live weather -> our model rebuilds the plan -> map shows distance-ordered relief |
| Risk plan is actionable                  | Every preview response includes work/rest/water numbers, not just a score                                            |
| API contract is a single source of truth | All request/response shapes live in `packages/shared` as Zod schemas                                                 |
| Demo credibility                         | Every screen showing seed data labels it as demo data                                                                |
| Mobile reality                           | Bottom navigation, one-handed reachability, large targets, high contrast                                             |
| API contract                             | All shapes defined once in `packages/shared`; versioned under `/api/v1` with a single error envelope                 |

## 8. Data behind the product

Four tables cover the phase (`users`, `worker_profiles`, `relief_points`, `check_ins`
— full schema in `docs/architecture.md`). Key product decisions encoded in the data:

- `water_access` / `shade_access` per worker profile (`none` / `limited` / `reliable`)
  directly modify the risk plan — two riders with the same weather exposure get
  different advice if one has reliable water.
- `relief_points.verified` is a boolean surfaced in the coordinator view so that
  unverified demo entries are visually distinct from confirmed ones.
- `check_ins.status` is a four-value enum chosen to be answerable with a single tap
  and aggregable without parsing free text.

## 9. Roadmap beyond this phase

1. Move the relief dataset from demo to verified: an on-ground workflow where a
   coordinator records a visit and flips `verified` with an audit trail.
2. Add Hindi copy behind a language switch.
3. Replace mock identity with OTP-based auth (mobile numbers, not email).
4. Share the weather cache across instances (Redis) before running more than one API
   replica — today the cache is per process.
5. Push notifications / SMS nudges at shift start and at risk-level changes.
6. Deploy per `docs/aws-deployment-plan.md` (staging, then production).

## 10. Constraints and risks

| Constraint / risk                           | Mitigation in this phase                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers will not read long text mid-shift   | Plan is 3–5 short bullets plus numbers; everything else is behind a tap                                                                            |
| Live weather depends on an upstream service | Our API owns the fetch, validates the provider response with Zod, caches briefly, and surfaces failures as failures — it never substitutes numbers |
| Demo relief data could be mistaken for real | `meta.demo = true` in every relief response + explicit on-screen labelling, including on the map                                                   |
| No auth invites misuse of check-ins         | Accepted trade-off for a mock-identity demo; OTP auth is roadmap item 3                                                                            |
| Low-end device performance                  | Small shell, few network calls per screen; the map bundle is lazy and never loads outside `/relief`                                                |
| Sunlight legibility                         | High-contrast tokens, large type, large tap targets enforced by the mobile shell                                                                   |

## 11. Glossary

- **WBGT** — Wet Bulb Globe Temperature, the standard occupational heat-stress
  metric. HeatShift uses a Simplified WBGT computed from temperature, humidity,
  estimated globe temperature and an outdoor coefficient.
- **Risk level** — `low` / `moderate` / `high` / `severe`, derived from WBGT bands.
- **Check-in** — A one-tap status report from a worker.
- **Relief point** — A physical location offering water, shade, clinic services,
  cooling space, or canteen. All seeded Delhi entries are **demo data**.
- **Coordinator** — A team lead (NGO, contractor, agency) watching aggregated
  check-ins rather than working outdoors themselves.
- **Mock identity** — Seeded user IDs used instead of login; a documented non-goal
  of this phase.
