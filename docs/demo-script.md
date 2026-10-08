# HeatShift — 5-Minute Demo Script

Audience: hackathon judges. Device: laptop presenting a phone-sized browser window
(Chrome DevTools device emulation, iPhone SE class) or a real Android phone on the
same Wi-Fi. Total time: 5 minutes. Everything runs locally via
`docker compose up --build` — no cloud dependency, no internet required.

## 0. Pre-demo checklist (do this before judges arrive)

- [ ] `docker compose up --build` shows all three services healthy
      (`docker compose ps` → `healthy` next to postgres, api, web).
- [ ] Browser tab open at `http://localhost:5173` on the landing page.
- [ ] Second tab open at `http://localhost:3000/health` (already loaded).
- [ ] DevTools device emulation set, or phone paired and same-network.
- [ ] Terminal visible with `docker compose logs -f api` ready (only if it helps
      narration; hide if it distracts).
- [ ] Know your seeded worker user ID for the check-in (dashboard uses a mock
      identity — no login exists, say so up front).

## 1. Minute 0:00–0:40 — The problem

Say: "Indian cities issue heat alerts. A delivery rider cannot act on a city-wide
alert. HeatShift turns heat data into a personal plan: what to do, when to rest,
where to get water."

Click: nothing yet — land on `/`. Let the tagline read.

## 2. Minute 0:40–1:30 — Dashboard: connectivity + risk plan

Click: **Dashboard** (bottom nav).

Point at, in order:

1. **API connectivity card** — green: proves the full stack (API + Postgres in
   Docker) is live. "This is a real API, not a mockup."
2. **Heat-risk preview** — inputs are shown (temperature, humidity, sun exposure,
   shift length, water/shade access). Say: "No weather provider is wired yet — the
   endpoint takes the weather inputs directly and applies a documented wet-bulb
   WBGT formula; a free provider plugs into the same contract."
3. Read the plan aloud from the response: work/rest minutes, water per hour, safe
   start hour. Tap a preset that lands in the **high** band and let the plan
   re-render. This is the core product moment — numbers, not warnings.

## 3. Minute 1:30–2:20 — Check-in (the one-tap loop)

Still on Dashboard, scroll to the check-in buttons.

Click: **Need water**.

Say: "One tap, status plus optional coarse location, stored against a mock identity
— authentication is deliberately out of this phase."

Then click **Okay** once more so the summary has mixed statuses, and switch to the
Coordinator tab.

## 4. Minute 2:20–3:10 — Coordinator view

Click: **Coordinator** (bottom nav).

Point at:

1. **24-hour totals per status** — "A team lead sees need_water climbing at 2 PM and
   dispatches water. That's the entire intervention loop."
2. **Most recent check-ins** list.
3. **Relief verification status** — how many points are unverified.

Refresh the page to show it re-fetching live from Postgres (the row you just tapped
is in the aggregate — call it out).

## 5. Minute 3:10–4:00 — Relief list

Click: **Relief** (bottom nav).

1. Filter: **Water**.
2. Say explicitly: **"These Delhi relief points are seeded demo data — flagged as
   demo by the API itself (`meta.demo: true`) and labelled on screen. The
   coordinator view is where on-ground verification moves entries to real."**
   Do not skip this line; it is credibility.
3. Open one entry: address, opening hours, verified badge state.

## 6. Minute 4:00–4:30 — Contract and architecture flex (short)

Click: API health tab (`/health`) and/or show the repo tree in one screen.

Say: "One monorepo: shared Zod schemas are the single source of truth — the web
client, the Fastify API and Postgres enums all validate against the same contract.
`docker compose up --build` gives you the whole thing, migrations and demo seed
included, in one command."

## 7. Minute 4:30–5:00 — Close

Say: "Next is a free weather provider behind the existing weather module contract,
Hindi copy, and OTP login. The AWS deployment plan is written and the CI already
builds the production images — deployment is the documented next step, not a
hand-wave." End on the Dashboard high-risk plan.

## Troubleshooting table

| Symptom                                                | Likely cause                                              | Fix                                                                                                                                                                           |
| ------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard shows the API offline banner                 | API container down or crashed on boot                     | `docker compose ps`; `docker compose logs api`; then `docker compose restart api`                                                                                             |
| `EADDRINUSE: address already in use :::3000` (or 5173) | Something else holds the port (old container, local node) | `lsof -i :3000` and kill it, or `docker compose down && docker compose up -d`. If a stale compose stack: `docker compose down --remove-orphans`                               |
| Compose stuck: `postgres service is unhealthy`         | Leftover half-initialised volume or slow start            | `docker compose down -v && docker compose up --build` (drops data, re-seeds demo data). Note: `-v` deletes the DB volume; relief/check-in demo rows are recreated by the seed |
| Web loads but relief list / risk preview errors        | Shared package not built after a pull                     | `pnpm --filter @heatshift/shared build` then `docker compose build --no-cache api web && docker compose up -d`                                                                |
| Changes not reflected                                  | Old images / cached layer                                 | `docker compose build --no-cache api web && docker compose up -d`                                                                                                             |
| Seed rows missing after `down -v`                      | Expected only if `SEED_ON_BOOT=false` locally             | Ensure local `.env` keeps `MIGRATE_ON_BOOT=true` and `SEED_ON_BOOT=true` (defaults in compose)                                                                                |
| PWA serves stale UI after a rebuild                    | Service worker cache                                      | DevTools → Application → Service Workers → Unregister + "Bypass for network", or hard reload with cache disabled                                                              |
| Judges' phone can't reach localhost                    | Same-network assumption failed                            | Fall back to laptop device-emulation tab; or serve web on `0.0.0.0` and use the laptop's LAN IP with `VITE_API_BASE_URL` pointing at the laptop IP (rebuild web)              |

## Judge Q&A cheat sheet

| Likely question                     | One-line answer                                                                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Where does the weather come from?" | Not wired yet by design; the preview endpoint takes weather inputs, and a free provider plugs into the existing `weather` module contract.                                                                       |
| "Is this medical advice?"           | No — it is an occupational work/rest/hydration plan from a documented WBGT formula (thresholds aligned with OSHA/ICMR-style guidance); the formula and its limits are written down in `docs/architecture.md` §6. |
| "Is the relief data real?"          | No — the seeded Delhi points are demo data, flagged `meta.demo = true` by the API and labelled on screen; the verification workflow is the path to real data.                                                    |
| "How do you deploy?"                | CI already builds both production images; the full AWS plan (ECS Fargate + ALB + RDS + CloudFront/S3, staged phases, cost notes, rollback) is in `docs/aws-deployment-plan.md` — not executed in this phase.     |
| "Why no login?"                     | Intentional non-goal for this phase; check-ins use a seeded mock identity so the product loop can be demonstrated end to end.                                                                                    |

**Recovery one-liner for almost everything:**
`docker compose down -v --remove-orphans && docker compose up --build` — fresh
database, migrations run, demo data re-seeded, stack healthy. Rehearse it once so
it runs during a 30-second "let me restart the backend" pause.
