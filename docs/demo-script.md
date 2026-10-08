# HeatShift — 5-Minute Demo Script

Audience: hackathon judges. Device: laptop presenting a phone-sized browser window
(Chrome DevTools device emulation, iPhone SE class) or a real Android phone on the
same Wi-Fi. Total time: 5 minutes. Everything runs locally via
`docker compose up --build`. Two beats need outbound internet — the live weather fetch and the
Mapbox base map. Everything else, including the manual plan and the full relief list, works
offline once the page is loaded.

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
- [ ] `VITE_MAPBOX_ACCESS_TOKEN` is set in the root `.env` and the web image was
      rebuilt, then load `/relief` once and confirm the base map draws.
- [ ] Click "Use my location for live heat risk" ahead of time and **allow** the
      prompt, so the browser is not asking mid-demo. Confirm the plan comes back
      labelled "Live weather via Open-Meteo".
- [ ] Rehearse the denial story on a second profile or with the permission blocked —
      the fallback must look deliberate, not broken.

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
2. **Live heat risk** — press **Use my location for live heat risk** and let the
   browser prompt. Say: "Nothing on this page asked for my location until I pressed
   that button. The API fetches the real observation from Open-Meteo and runs our
   own wet-bulb WBGT model on it — the provider is data, the judgement is ours."
   Point at the provenance line under the plan: provider, observation time, age.
   Then press **Refresh live plan** to show it re-fetches.
3. **Manual heat-risk preview** — the same card without a position: temperature,
   humidity, sun exposure, shift length, water/shade access. Say: "If the worker
   says no to the location prompt, this path still gives a full plan from typed
   answers. A denial is a normal state, not a broken screen."
4. Read the plan aloud from the response: work/rest minutes, water per hour, safe
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
2. Press **Use my location** and watch the list re-order by real distance from where
   you are standing.
3. Click a marker on the map, then a row in the list — both select the same point and
   the panel beside the map shows its distance, hours and coordinates. Say: "The list
   is the reliable view; the map is the same response drawn, not a second source of
   truth."
4. Say explicitly: **"These Delhi relief points are seeded demo data — flagged as
   demo by the API itself (`meta.demo: true`) and labelled on screen. The map under
   them is a real Mapbox base map; the markers on it are not verified places."**
   Do not skip this line; it is credibility.
5. Open one entry: address, opening hours, verified badge state.

## 6. Minute 4:00–4:30 — Contract and architecture flex (short)

Click: API health tab (`/health`) and/or show the repo tree in one screen.

Say: "One monorepo: shared Zod schemas are the single source of truth — the web
client, the Fastify API and Postgres enums all validate against the same contract.
`docker compose up --build` gives you the whole thing, migrations and demo seed
included, in one command."

## 7. Minute 4:30–5:00 — Close

Say: "Next is moving the relief dataset from demo to verified, Hindi copy, and OTP
login. Live weather and the real map are done — the provider sits behind our own API
contract, so the model never sees a vendor SDK. The AWS deployment plan is written and
the CI already builds the production images — deployment is the documented next step,
not a hand-wave." End on the Dashboard high-risk plan.

## Troubleshooting table

| Symptom                                                | Likely cause                                                        | Fix                                                                                                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard shows the API offline banner                 | API container down or crashed on boot                               | `docker compose ps`; `docker compose logs api`; then `docker compose restart api`                                                                                             |
| `EADDRINUSE: address already in use :::3000` (or 5173) | Something else holds the port (old container, local node)           | `lsof -i :3000` and kill it, or `docker compose down && docker compose up -d`. If a stale compose stack: `docker compose down --remove-orphans`                               |
| Compose stuck: `postgres service is unhealthy`         | Leftover half-initialised volume or slow start                      | `docker compose down -v && docker compose up --build` (drops data, re-seeds demo data). Note: `-v` deletes the DB volume; relief/check-in demo rows are recreated by the seed |
| Web loads but relief list / risk preview errors        | Shared package not built after a pull                               | `pnpm --filter @heatshift/shared build` then `docker compose build --no-cache api web && docker compose up -d`                                                                |
| Changes not reflected                                  | Old images / cached layer                                           | `docker compose build --no-cache api web && docker compose up -d`                                                                                                             |
| Seed rows missing after `down -v`                      | Expected only if `SEED_ON_BOOT=false` locally                       | Ensure local `.env` keeps `MIGRATE_ON_BOOT=true` and `SEED_ON_BOOT=true` (defaults in compose)                                                                                |
| PWA serves stale UI after a rebuild                    | Service worker cache                                                | DevTools → Application → Service Workers → Unregister + "Bypass for network", or hard reload with cache disabled                                                              |
| Relief page shows "Map unavailable"                    | No `VITE_MAPBOX_ACCESS_TOKEN` when the web image was built          | Set it in the root `.env`, then `docker compose up --build -d web`; the list and distances work regardless                                                                    |
| Map area is blank or never finishes with a token set   | Token origin restriction, or no outbound access to `api.mapbox.com` | Check the token's URL authorisation list includes the serving origin; the list view is unaffected either way                                                                  |
| Live plan reports the provider as unavailable          | API container has no outbound HTTPS                                 | `docker compose logs api`; the manual path still produces a full plan, so demo the typed answers instead                                                                      |
| Judges' phone can't reach localhost                    | Same-network assumption failed                                      | Fall back to laptop device-emulation tab; or serve web on `0.0.0.0` and use the laptop's LAN IP with `VITE_API_BASE_URL` pointing at the laptop IP (rebuild web)              |

## Judge Q&A cheat sheet

| Likely question                     | One-line answer                                                                                                                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Where does the weather come from?" | Open-Meteo, fetched server-side by our own `weather` module, validated with Zod, cached ~10 minutes per coarse cell. The response names the provider and the observation time; if the provider fails we return `WEATHER_UNAVAILABLE` rather than invent numbers. |
| "Is the map real?"                  | Yes — a real Mapbox GL base map behind a public, domain-restricted token, lazy-loaded so only the relief page downloads it. Without a token the page shows a fallback and the list is unchanged.                                                                 |
| "Is this medical advice?"           | No — it is an occupational work/rest/hydration plan from a documented WBGT formula (thresholds aligned with OSHA/ICMR-style guidance); the formula and its limits are written down in `docs/architecture.md` §6.                                                 |
| "Is the relief data real?"          | No — the seeded Delhi points are demo data, flagged `meta.demo = true` by the API and labelled on screen; the verification workflow is the path to real data.                                                                                                    |
| "How do you deploy?"                | CI already builds both production images; the full AWS plan (ECS Fargate + ALB + RDS + CloudFront/S3, staged phases, cost notes, rollback) is in `docs/aws-deployment-plan.md` — not executed in this phase.                                                     |
| "Why no login?"                     | Intentional non-goal for this phase; check-ins use a seeded mock identity so the product loop can be demonstrated end to end.                                                                                                                                    |

**Recovery one-liner for almost everything:**
`docker compose down -v --remove-orphans && docker compose up --build` — fresh
database, migrations run, demo data re-seeded, stack healthy. Rehearse it once so
it runs during a 30-second "let me restart the backend" pause.
