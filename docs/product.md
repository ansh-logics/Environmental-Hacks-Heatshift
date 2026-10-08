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
   shaded areas, clinics, cooling spaces and canteens.
   **The seeded relief dataset for Delhi is DEMO data.** Nothing in this phase is
   verified against physical sites in production.
4. **Coordinator view.** Team leads and NGO workers see aggregated check-in status
   (okay / need water / need break / unwell) for the last 24 hours and which relief
   points are still unverified.

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
2. Sees the heat-risk card: score, level, and the plan ("work 25 min / rest 10 min,
   750 ml water per hour, stop by 18:00").
3. Taps one check-in button during the shift ("Okay", "Need water", "Need break",
   "Unwell") — optional location attached if granted.
4. On the relief screen, filters by "Water" and walks to the nearest listed point.

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
  passwords, OTPs, or sessions.
- **No maps.** Relief locations are presented as a list with distances and
  addresses, not a rendered map.
- **No AI features.** The risk model is a transparent, documented formula (see
  `docs/architecture.md`), not a learned model.
- **No live weather provider.** The heat-risk preview endpoint takes weather inputs
  directly from the client. A free provider integration is planned; until then the
  API contract keeps a weather module as a contract-only placeholder.
- **No offline data sync.** The PWA shell caches for reloads; writes are online-only.
- **No paid APIs.** Every data source used or planned is free-tier.
- **No deployments.** AWS is documented as a target architecture only
  (`docs/aws-deployment-plan.md`, `infra/aws/`). Nothing is deployed in this phase.

## 7. Success criteria for the foundation phase

| Criterion                                | Measure                                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| End-to-end path works locally            | `docker compose up --build` yields a usable app in one command                                       |
| Risk plan is actionable                  | Every preview response includes work/rest/water numbers, not just a score                            |
| API contract is a single source of truth | All request/response shapes live in `packages/shared` as Zod schemas                                 |
| Demo credibility                         | Every screen showing seed data labels it as demo data                                                |
| Mobile reality                           | Bottom navigation, one-handed reachability, large targets, high contrast                             |
| API contract                             | All shapes defined once in `packages/shared`; versioned under `/api/v1` with a single error envelope |

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

1. Wire a free weather provider into the existing `weather` module contract.
2. Add Hindi copy behind a language switch.
3. Replace mock identity with OTP-based auth (mobile numbers, not email).
4. On-ground verification workflow to move relief points from demo to verified.
5. Push notifications / SMS nudges at shift start and at risk-level changes.
6. Deploy per `docs/aws-deployment-plan.md` (staging, then production).

## 10. Constraints and risks

| Constraint / risk                                   | Mitigation in this phase                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Workers will not read long text mid-shift           | Plan is 3–5 short bullets plus numbers; everything else is behind a tap                                 |
| Weather inputs are manual until a provider is wired | Preview endpoint contract is provider-agnostic; integration is additive (see `docs/api-contract.md` §8) |
| Demo relief data could be mistaken for real         | `meta.demo = true` in every relief response + explicit on-screen labelling                              |
| No auth invites misuse of check-ins                 | Accepted trade-off for a mock-identity demo; OTP auth is roadmap item 3                                 |
| Low-end device performance                          | Small bundle, few network calls per screen, no map tiles, no heavy charts                               |
| Sunlight legibility                                 | High-contrast tokens, large type, large tap targets enforced by the mobile shell                        |

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
