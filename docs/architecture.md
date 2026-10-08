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
                      +---------------------------+        +----------------------+
                             healthcheck /health                    healthcheck pg_isready
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
        lib/             API client (typed against @heatshift/shared)
      vite.config.ts     includes vite-plugin-pwa
      Dockerfile         multi-stage: build -> nginx runtime
    api/
      src/
        modules/
          health/        GET /health
          heat-risk/     POST /api/v1/heat-risk/preview + algorithm
          weather/       contract-only placeholder (no route registered)
          relief-points/ GET /api/v1/relief-points
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

| Module          | Route surface                                             | Responsibility                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `health`        | `GET /health`                                             | Reports `service` and `database` status; performs a real `SELECT 1` so container health checks mean something.                                                                                        |
| `heat-risk`     | `POST /api/v1/heat-risk/preview`                          | Runs the WBGT-based algorithm (section 6). Stateless: inputs come from the request because no weather provider is wired yet.                                                                          |
| `weather`       | _none (contract only)_                                    | A placeholder module holding the future provider interface (fetch conditions by location/time). Deliberately registers no route in this phase so the client never depends on an unstable integration. |
| `relief-points` | `GET /api/v1/relief-points`                               | Filterable list (type, verifiedOnly, limit). Tags responses `meta.demo = true` because the seeded Delhi dataset is demo data.                                                                         |
| `check-ins`     | `POST /api/v1/check-ins`, `GET /api/v1/check-ins/summary` | Persists one-tap worker status check-ins; aggregates totals per status over the last 24 h plus the most recent items, optionally scoped by `userId`.                                                  |

Every handler validates request params/body/query with Zod schemas from
`packages/shared` and validates responses too — a contract violation fails at the
boundary, not in the UI.

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
  in application code (haversine), keeping the RDS target vanilla PostgreSQL.
- Migrations are Drizzle-generated; the boot-time idempotent seed (`SEED_ON_BOOT`)
  is never a manual step for the demo.

## 6. Heat-risk algorithm

Implemented in `apps/api/src/modules/heat-risk/`. Transparent, deterministic, and
documented — judges and future public-health partners must be able to audit it.

### 6.1 Inputs (all supplied by `POST /api/v1/heat-risk/preview`)

`temperatureC`, `humidityPercent`, `windSpeedKmh`, `sunExposure` (`full_sun` /
`partial_shade` / `deep_shade` / `indoor`), `hoursInShift`, `workType`, `waterAccess`,
`shadeAccess`, `acclimatized`. The enums and defaults live in
`@heatshift/shared` (`heatRiskPreviewRequestSchema`), so the API and UI cannot drift.

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
  connectivity card, heat-risk preview, check-in buttons, nearby relief list),
  `/relief` (ReliefMapPage: filterable list, explicitly labelled demo data),
  `/coordinator` (CoordinatorPage: 24 h team check-in summary + relief verification
  status).
- **Shell:** mobile-first layout with bottom navigation; four destinations max.
- **Connectivity card:** the dashboard probes `GET /health` and shows an offline
  banner when the API is unreachable — vital for demo resilience and real networks.
- **PWA:** `vite-plugin-pWA` generates the manifest and precaches the app shell so
  reloads on flaky connections still render the UI (data is online-only; no
  background sync in this phase).
- **Typing:** all fetch calls are typed against `@heatshift/shared` schemas; runtime
  parsing at the client boundary makes the UI fail loudly, not silently, on drift.
- `VITE_API_BASE_URL` is baked at **build** time (Vite static env), which is why the
  web image build depends on the API URL being known.

## 8. Configuration and secrets

- Only `.env.example` is committed; real `.env` files are git-ignored.
- API env is parsed by a Zod module (`apps/api/src/env.ts`) and the process exits
  immediately on invalid config — never a half-booted server.

| Variable            | Used by | Purpose                                         |
| ------------------- | ------- | ----------------------------------------------- |
| `PORT`, `HOST`      | api     | Listen address (container binds `0.0.0.0:3000`) |
| `CORS_ORIGIN`       | api     | Allowed browser origin(s)                       |
| `DATABASE_URL`      | api     | postgres.js connection string                   |
| `NODE_ENV`          | api     | Environment switch                              |
| `LOG_LEVEL`         | api     | Fastify logger verbosity                        |
| `MIGRATE_ON_BOOT`   | api     | Run migrations at container start               |
| `SEED_ON_BOOT`      | api     | Run idempotent demo seed at container start     |
| `VITE_API_BASE_URL` | web     | API base URL baked into the bundle              |

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
