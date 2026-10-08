# HeatShift — Architecture

## 1. Overview

HeatShift is a pnpm-workspaces monorepo containing a React PWA (`apps/web`), a
Fastify API (`apps/api`), a shared contract package (`packages/shared`) and a
lint-config package (`packages/eslint-config`). Local development and the demo run
entirely through Docker Compose against a PostgreSQL 16 container. No cloud
resources exist in this phase; AWS is documented as a target only.

**Guiding principle: a small realistic hackathon architecture.** Every component is
one a production team would actually run (Postgres, a typed schema-validated API,
an ORM with migrations, container health checks, CI building the same images that
ship), but nothing is included that the team would operate without getting value
from — no Kubernetes, no service mesh, no queue layer, no microservices. The
boundary lines (shared Zod contracts, module-per-domain API, env-validated config)
are drawn exactly where a real scale-out would need them, so the jump to AWS is a
deployment change, not a redesign.

## 2. Local / Docker topology

```
                        Browser (mobile viewport)
                                  |
                                  | http://localhost:5173
                                  v
                      +---------------------------+
                      |   web container (nginx)   |
                      |  serves production Vite   |
                      |  build + SPA fallback     |
                      |  vite-plugin-pwa assets   |
                      +-----------+---------------+
                                  |
                                  | http://localhost:3000/api/v1/...
                                  | (VITE_API_BASE_URL baked at build time)
                                  v
                      +---------------------------+        +----------------------+
                      |      api container        |  SQL   |  postgres container  |
                      | node dist/server.js       +------->|  postgres:16-alpine  |
                      | Fastify 5 + Drizzle +     |        |  volume: pgdata      |
                      | postgres.js               |        |                      |
                      | boot: migrate -> seed ->  |        |                      |
                      |       start               |        |                      |
                      +-------------+-------------+        +----------------------+
                        healthcheck /health                   healthcheck pg_isready
                                    |
                                    | https (server-side, worker's coordinates only)
                                    v
                          api.open-meteo.com

        Browser also fetches map tiles + style directly from api.mapbox.com
        on /relief only, with the public token baked into the web bundle.
```

- `docker compose up --build` is the single entry point.
- Health checks exist on all three services; Compose marks the stack healthy only
  when Postgres accepts queries, the API answers `/health`, and nginx serves files.
- The API container boot script runs migrations then an **idempotent** seed (safe
  to re-run; inserts demo rows only), so a fresh volume yields a demo-ready
  database with no manual step.
- The seed inserts the Delhi relief-point dataset. **These relief points are DEMO
  data**, not verified physical locations; every API response carrying them sets
  `meta.demo = true` and the web UI labels them accordingly.

## 3. Monorepo layout

```
heatshift/
  apps/
    web/                 React 19 + Vite + TypeScript PWA
      src/
        routes/          HomePage, WorkerDashboardPage, ReliefMapPage, CoordinatorPage
        components/      mobile shell, bottom navigation, cards
        features/        relief-points/ (list, Mapbox map, marker factory),
                         heat-risk/ (manual + live plan hooks)
        lib/             API client (typed against @heatshift/shared)
      vite.config.ts     root envDir, vite-plugin-pwa, ES worker format for Mapbox
      Dockerfile         multi-stage: build -> nginx runtime
    api/
      src/
        modules/
          health/        GET /health
          heat-risk/     POST /api/v1/heat-risk/preview + /live + algorithm
          weather/       Open-Meteo provider, GET /api/v1/weather/conditions, cache
          relief-points/ GET /api/v1/relief-points (+ distance ordering)
          check-ins/     POST /api/v1/check-ins, GET /api/v1/check-ins/summary
        db/
          schema.ts      Drizzle table definitions
          migrate.ts     migration runner
          seed.ts        idempotent demo seed
        env.ts           Zod-validated process.env (fails fast on boot)
        server.ts        Fastify bootstrap, plugin + module registration
      Dockerfile         multi-stage: build (tsup) -> node runtime
  packages/
    shared/              Zod schemas, inferred types, constants — single source of
                         truth for every API contract
    eslint-config/       Shared ESLint flat config consumed by all workspaces
  docker-compose.yml     postgres + api + web
  .github/workflows/ci.yml
```

Dependency direction: both apps depend on `packages/shared`; `shared` depends on
nothing in-repo — the only web/api coupling is the contract package, never imports.

## 4. API module boundaries

Each module owns its route registration, service logic and validation glue. Modules
do not import each other's internals; cross-module needs go through `shared` types
or the database.

| Module          | Route surface                                                   | Responsibility                                                                                                                                                                                                                    |
| --------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `health`        | `GET /health`                                                   | Reports `service` and `database` status; performs a real `SELECT 1` so container health checks mean something.                                                                                                                    |
| `heat-risk`     | `POST /api/v1/heat-risk/preview`, `POST /api/v1/heat-risk/live` | Runs the WBGT-based algorithm (section 6). `preview` takes weather from the request; `live` takes a position plus the worker profile, fetches weather through the `weather` **service** in-process, and feeds the same algorithm. |
| `weather`       | `GET /api/v1/weather/conditions`                                | Open-Meteo provider: fetch, strict Zod validation of the upstream payload, per-process cache, and a typed `WeatherConditions` result. The only module that talks to an upstream HTTP API.                                         |
| `relief-points` | `GET /api/v1/relief-points`                                     | Filterable list (type, verifiedOnly, limit) plus optional `latitude`/`longitude`, which adds `distanceKm` to each row and returns nearest-first. Tags responses `meta.demo = true`.                                               |
| `check-ins`     | `POST /api/v1/check-ins`, `GET /api/v1/check-ins/summary`       | Persists one-tap worker status check-ins; aggregates totals per status over the last 24 h plus the most recent items, optionally scoped by `userId`.                                                                              |

Every handler validates request params/body/query with Zod schemas from
`packages/shared` and validates responses too — a contract violation fails at the
boundary, not in the UI.

### 4.1 Weather provider, cache, and the in-process call

`POST /api/v1/heat-risk/live` needs weather. It does **not** make an HTTP request to
`GET /api/v1/weather/conditions` — a route calling another route over the network
would add a hop, a timeout and a failure mode for no benefit inside one process.
Instead both routes call `weatherService.getConditions()` directly, and the HTTP
endpoint exists as a public contract for other clients.

Provider rules, all in `apps/api/src/modules/weather/`:

- **Open-Meteo, no key.** The request pins the current-weather fields we consume; the
  URL is built from validated numbers only, so no user string reaches the upstream URL.
- **Upstream responses are not trusted.** The payload is parsed with a Zod schema;
  anything malformed (missing `current`, NaN temperatures, an unexpected shape) is a
  provider failure and answers `WEATHER_UNAVAILABLE` with `502` (`503` when the 6 s
  timeout fires). There is no fallback to invented numbers — a worker must never see
  a plan built from weather that was not observed.
- **Cache: 0.1° cell, 600 s TTL, in-process.** Coordinates are rounded to a 0.1°
  cell (~11 km) before the key, so a rider moving down a road does not re-hit the
  provider every refresh. Identical in-flight requests share one promise. Failures
  are never cached, so a blip is retried on the next ask instead of sticking for ten
  minutes.
- **Consequence to know before scaling out:** the cache is per process. Two API
  replicas keep two caches, and a container restart empties it. That is fine for one
  container on a laptop demo; it is roadmap item 4 in `docs/product.md` before
  running more than one replica.
- **Honest coordinates.** Open-Meteo answers on its own ~0.25° grid, so the response
  carries both the position that was asked for (`coordinates`) and the grid point the
  provider actually used (`weather.location`). Distances and provenance never claim
  more precision than the data has.
- **Time is normalised.** The provider reports local wall-clock without an offset;
  the module converts it to a UTC ISO stamp and returns `freshness.ageSeconds`, so
  "observed 6 minutes ago" is computed from the data, not from the browser's clock.

## 5. Data model (Drizzle / PostgreSQL)

```
users
  id             uuid          PK
  name           text
  role           'worker' | 'coordinator'
  created_at     timestamptz

worker_profiles
  user_id               uuid        PK, FK -> users.id
  work_type             text
  city                  text
  default_shift_start   time
  default_shift_end     time
  water_access          'none' | 'limited' | 'reliable'
  shade_access          'none' | 'limited' | 'reliable'

relief_points
  id            uuid        PK
  name          text
  type          'water' | 'shade' | 'clinic' | 'cooling_space' | 'canteen'
  latitude      double precision
  longitude     double precision
  address       text
  verified      boolean
  opening_hours text
  created_at    timestamptz
  -- SEEDED DELHI ROWS ARE DEMO DATA (meta.demo surfaced in the API)

check_ins
  id         uuid        PK
  user_id    uuid        FK -> users.id
  status     'okay' | 'need_water' | 'need_break' | 'unwell'
  latitude   double precision  NULL
  longitude  double precision  NULL
  created_at timestamptz
```

Design notes:

- Enum-like columns are constrained to the exact unions defined in `shared` so the
  database and the Zod schemas cannot drift independently.
- `worker_profiles` is 1:1 with `users` and keyed by `user_id` — profile data only
  exists for workers.
- No PostGIS in this phase: coordinates are plain floats and distance is computed
  in application code (haversine), keeping the RDS target vanilla PostgreSQL. When a
  position is supplied the service reads at most `DISTANCE_SCAN_LIMIT` (500) rows,
  sorts by distance in memory and returns the requested page — correct for a seeded
  city, and the number to revisit before a real multi-city dataset.
- Migrations are Drizzle-generated; the boot-time idempotent seed (`SEED_ON_BOOT`)
  is never a manual step for the demo.

## 6. Heat-risk algorithm

Implemented in `apps/api/src/modules/heat-risk/`. Transparent, deterministic, and
documented — judges and future public-health partners must be able to audit it.

### 6.1 Inputs

`temperatureC`, `humidityPercent`, `windSpeedKmh`, `sunExposure` (`full_sun` /
`partial_shade` / `deep_shade` / `indoor`), `hoursInShift`, `workType`, `waterAccess`,
`shadeAccess`, `acclimatized`. The enums and defaults live in
`@heatshift/shared` (`heatRiskPreviewRequestSchema`), so the API and UI cannot drift.

Two routes feed those nine numbers in:

- `POST /api/v1/heat-risk/preview` — the caller supplies the observation (manual city
  and shift answers, tests, demos).
- `POST /api/v1/heat-risk/live` — the caller supplies a position plus the profile; the
  observation comes from `weather` (§4.1). Only the three measured fields change
  source; `sunExposure` deliberately stays the worker's answer, because what they are
  standing under matters more to the plan than the cloud cover above it. The sky's own
  reading is still visible in the response as `weather.sunExposure`.

Both call the same function with the same schema, so a live plan and a typed plan are
the same object and render identically.

### 6.2 Wet-bulb temperature

`Tw` is solved from first principles rather than a lookup table, so the response can be
audited:

```
es(t)  = 6.112 * exp(17.67 t / (t + 243.5))        # Magnus-Tetens saturation pressure, hPa
e      = (RH / 100) * es(T)                        # actual vapour pressure
f(Tw)  = es(Tw) - gamma * P * (T - Tw) - e         # psychrometric equation
gamma  = 0.000665 per degC,  P = 1010 hPa default
```

`Tw` is found by bisection between the dew point (lower bound) and the dry bulb (upper
bound), 40 iterations. Sanity checks: 20 C / 50 %RH -> 13.8 C, 44 C / 24 %RH -> 26.1 C,
34 C / 78 %RH -> 30.6 C.

### 6.3 Estimated globe temperature and WBGT

No feed publishes a globe thermometer, so `Tg` is estimated from dry-bulb temperature plus
a solar load, minus convective cooling:

```
solarGain = { full_sun: 12, partial_shade: 6, deep_shade: 2, indoor: 0 }   # degC above air
windCool  = min(6, windSpeedKmh / 6)
Tg        = T + solarGain - windCool

WBGT(outdoor, sun-loaded) = 0.561 * Tw + 0.394 * Tg + 0.041 * T
WBGT(indoor, no direct sun) = 0.7 * Tw + 0.3 * Tg
```

The occupational strain value then adds the worker's own load:

```
strain = WBGT
       + (workIntensity - 0.8) * 3        # construction 1.00, sanitation 0.95,
                                          # delivery_rider 0.90, street_vendor 0.75,
                                          # security_guard 0.60, other 0.80
       + waterAccessImpact + shadeAccessImpact   # none +1.5, limited 0, reliable -1
       + (acclimatized ? 0 : +2)
```

`strain` is what the level bands and the 0-100 score are computed from
(`score = clamp((strain - 24) / 14 * 100, 0..100)`), and it is returned as `wbgtC` so the
UI can show the number behind the colour.

### 6.4 Level thresholds

WBGT bands are aligned with OSHA and ICMR-style occupational heat guidance:

| WBGT (°C)   | Level      | Meaning                                                |
| ----------- | ---------- | ------------------------------------------------------ |
| ≤ 28.0      | `low`      | Standard work with water available                     |
| 28.0 – 30.0 | `moderate` | Formal rest breaks introduced                          |
| 30.0 – 32.5 | `high`     | Aggressive work/rest cycling                           |
| > 32.5      | `severe`   | Exposure should be minimised; shift shortening advised |

The response also carries a 0–100 `score` (monotonic in WBGT across the working
range) and a human `label`.

### 6.5 Plan derivation

Baseline work/rest cycles per level (moderate-intensity outdoor work), e.g.:

| Level    | Work min / cycle | Rest min / cycle | Water ml/h (base) | Max shift | Risky window starts |
| -------- | ---------------- | ---------------- | ----------------- | --------- | ------------------- |
| low      | 50               | 10               | 350               | 480 min   | 15:00               |
| moderate | 40               | 20               | 500               | 360 min   | 14:00               |
| high     | 25               | 35               | 750               | 240 min   | 12:00               |
| severe   | 15               | 45               | 1000              | 120 min   | 11:00               |

Base hydration is scaled by work intensity (`waterMlPerHour = round(base * (0.85 +
intensity * 0.2) / 50) * 50`), so a construction crew at the same strain as a seated
guard is told to drink more.

Where the modifiers act:

- **Work intensity**, **water / shade access** and **acclimatisation** enter the model
  _before_ the band lookup — they move `strain` (§6.3), which can escalate the level and
  therefore swap the table row outright. `reliable` access de-escalates by 1 °C but is
  capped, so it can never turn `severe` into business as usual.
- **Shift length** is compared against the row's `maxRecommendedShiftMinutes` and
  `unsafeStartHour`; the shortfall surfaces in `advice[]` (plain-language bullets the UI
  renders directly).

The full plan object in the response is
`{ workMinutesPerCycle, restMinutesPerCycle, waterMlPerHour,
   maxRecommendedShiftMinutes, unsafeStartHour, advice[] }`.

## 7. Frontend architecture

- **Routes:** `/` (HomePage landing), `/dashboard` (WorkerDashboardPage: API
  connectivity card, live + manual heat-risk plan, check-in buttons, nearby relief
  list), `/relief` (ReliefMapPage: filterable list beside a Mapbox map, explicitly
  labelled demo data), `/coordinator` (CoordinatorPage: 24 h team check-in summary +
  relief verification status).
- **Shell:** mobile-first layout with bottom navigation; four destinations max.
- **Connectivity card:** the dashboard probes `GET /health` and shows an offline
  banner when the API is unreachable — vital for demo resilience and real networks.
- **Location, only on purpose:** `useLocation()` asks the browser for a position when
  the worker presses the button and never on page load. The coordinates live in that
  hook's state — no storage write — and leave the device only in a request the worker
  started (a weather lookup they asked for, or a check-in they sent). A denied prompt
  falls back to the demo centre with an amber status, not an error screen.
- **Map loading:** `features/relief-points/relief-map.tsx` is the only file that
  imports `mapbox-gl`, and it is reached through `lazy()`. Because nothing else
  pulls it in, the Mapbox runtime, its CSS and its worker are requested on `/relief`
  alone — measured at 0 requests to `api.mapbox.com` from `/`, `/dashboard` and
  `/coordinator`. Without a token the lazy chunk is never even fetched and the panel
  explains itself instead.
- **Markers are real controls:** each marker is a `<button>` with a descriptive
  `aria-label`, and selection is mirrored through props so the list and the map
  always agree. Mapbox rewrites a marker element that has no `role` of its own into
  `role="img"`, which would hide the click from assistive tech, so the element
  declares `role="button"` before Mapbox sees it. Selection restyles the existing
  node instead of replacing it, which keeps keyboard focus on the marker the worker
  just activated. Details open in a panel next to the map rather than a Mapbox popup.
- **PWA:** `vite-plugin-pwa` generates the manifest and precaches the app shell only
  (`index.html`, the manifest, the entry JS/CSS). Lazy route chunks are deliberately
  left out of the precache — precaching everything would download the map on the home
  page — and are cached on first use by a `CacheFirst` runtime rule. API calls stay
  `NetworkFirst` with a 5 s timeout (data is online-only; no background sync).
- **Typing:** all fetch calls are typed against `@heatshift/shared` schemas; runtime
  parsing at the client boundary makes the UI fail loudly, not silently, on drift.
- `VITE_API_BASE_URL` is baked at **build** time (Vite static env), which is why the
  web image build depends on the API URL being known.

## 8. Configuration and secrets

- Only `.env.example` is committed; real `.env` files are git-ignored.
- API env is parsed by a Zod module (`apps/api/src/env.ts`) and the process exits
  immediately on invalid config — never a half-booted server.

| Variable                   | Used by | Purpose                                                              |
| -------------------------- | ------- | -------------------------------------------------------------------- |
| `PORT`, `HOST`             | api     | Listen address (container binds `0.0.0.0:3000`)                      |
| `CORS_ORIGIN`              | api     | Allowed browser origin(s)                                            |
| `DATABASE_URL`             | api     | postgres.js connection string                                        |
| `NODE_ENV`                 | api     | Environment switch                                                   |
| `LOG_LEVEL`                | api     | Fastify logger verbosity                                             |
| `MIGRATE_ON_BOOT`          | api     | Run migrations at container start                                    |
| `SEED_ON_BOOT`             | api     | Run idempotent demo seed at container start                          |
| `VITE_API_BASE_URL`        | web     | API base URL baked into the bundle                                   |
| `VITE_MAPBOX_ACCESS_TOKEN` | web     | Public, domain-restricted Mapbox token for the relief map. Optional. |

### 8.1 The Mapbox token

The token is a **public browser key** (`pk.…`), not a secret: it is visible in the
JS bundle by design and is protected by URL authorisation configured in the Mapbox
account, not by concealment. That said, it never enters the repository.

- It lives only in the git-ignored root `.env`; `.env.example` documents the key with
  an empty value.
- `apps/web/vite.config.ts` sets `envDir` to the repository root, so `pnpm dev` reads
  the same file `docker compose` interpolates. One value, one place, no dev/prod skew.
- `.dockerignore` excludes `.env`, so the production build receives it as a Docker
  `ARG` that Compose interpolates from the root file rather than a file copied into
  the image. The web image does set it as `ENV` during the build stage, so the value
  is readable from that stage's image config — acceptable for a domain-restricted
  public key, and the reason the restriction is configured in the Mapbox account
  instead of relying on the value staying hidden.
- Vite inlines `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` as a literal at build time.
  The eager entry chunk therefore contains the token string once (through the
  `HAS_MAPBOX_TOKEN` boolean in `lib/constants.ts`) and again inside the lazy map
  chunk. That is the expected shape of a public client key; the boolean exists so the
  rest of the app never handles the value.
- An empty token is a supported configuration, not a broken one: the relief list works
  unchanged and the map area renders a fallback that says what is missing.

No server-side Mapbox secret (no `sk.…`) is used anywhere in the project.

## 9. Build and CI

- API: `dev` = `tsx watch`, `build` = `tsup` bundle to `dist/server.js`,
  `start` = `node dist/server.js`.
- Web: `vite build` output served by nginx in the container (production parity even
  locally).
- CI (`.github/workflows/ci.yml`): `pnpm install` → build `shared` → lint →
  typecheck → build both apps → `docker build` of the api and web images.
  **CI builds images but deploys nothing** — no deployment happens in this phase.

## 10. Data flow example: one check-in round trip

```
Rider taps "Need water"
  -> web POST /api/v1/check-ins { userId, status: "need_water", lat?, lng? }
  -> Fastify: Zod parses body against shared schema (400 on violation)
  -> Drizzle insert into check_ins; returns row
  -> Coordinator page poll/refetch shows the new aggregate count
```

Every hop is validated against `packages/shared`, so rider, API and coordinator
views cannot disagree about what `need_water` means.

## 11. Data flow example: the live loop

```
Rider presses "Use my location for live heat risk"
  -> browser geolocation prompt (first and only time the app asks)
  -> web POST /api/v1/heat-risk/live { latitude, longitude, profile… }
  -> Fastify: Zod parses the body (400 on violation)
  -> weatherService.getConditions() in-process   (no loopback HTTP, see §4.1)
       cache hit  -> stored observation + freshness.cached = true
       cache miss -> https://api.open-meteo.com (6 s abort) -> Zod parse -> cache
       failure    -> WEATHER_UNAVAILABLE 502/503; no plan is computed
  -> heat-risk model (same function §6 uses) -> plan + weather + source
  -> UI renders the plan, labelled "Live weather via Open-Meteo", observed <time>
     (age from freshness.ageSeconds), and keeps the previous plan on screen if the
     refresh fails
```

On `/relief` the same position orders the list: `GET /api/v1/relief-points` with
`latitude`/`longitude` returns `distanceKm` nearest-first, and the Mapbox pane plots
exactly those rows. The map is a view of the same response, never a second source of
truth.
