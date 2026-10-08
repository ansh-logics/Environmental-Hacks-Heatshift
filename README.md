# HeatShift

**Personal heat risk, a work/rest/hydration plan, and nearby relief — for the people who cannot
stay indoors.**

HeatShift is a mobile-first PWA for outdoor and gig workers in India (delivery riders, security
guards, construction workers, street vendors, sanitation staff). City-wide heat alerts do not tell
an individual worker what to do right now. HeatShift turns weather inputs into a 0–100 personal
heat-strain score, a concrete work/rest/water plan, and a list of nearby water points, shade,
clinics and cooling spaces.

> **Status: project foundation.** This repository currently contains a runnable monorepo, a Docker
> Compose stack, five API endpoints, a demo Delhi dataset and a working PWA shell. Product features
> (live weather integration, maps, accounts, notifications) are deliberately **not** built yet.

---

## 1. Quick start (Docker — the one command that must work)

Requirements: Docker with Compose v2, and ~2 GB free disk for the images.

```bash
git clone <your-fork-url> heatshift
cd heatshift
cp .env.example .env          # optional: defaults work as-is
docker compose up --build
```

Then open:

| URL                                        | What                                                    |
| ------------------------------------------ | ------------------------------------------------------- |
| http://localhost:5173                      | HeatShift PWA (nginx serving the production Vite build) |
| http://localhost:3000/health               | API health, including database status                   |
| http://localhost:3000/api/v1/relief-points | Seeded Delhi relief points (demo data)                  |

Stop with `Ctrl+C`, then:

```bash
docker compose down           # keeps the database volume
docker compose down -v        # also deletes it (fresh start next time)
```

On first boot the API container automatically runs Drizzle migrations and the idempotent demo
seed (`MIGRATE_ON_BOOT`, `SEED_ON_BOOT`).

### Verify it is healthy

```bash
docker compose ps                                  # all three services should say "healthy"
curl -s localhost:3000/health | head -c 200
curl -s "localhost:3000/api/v1/relief-points?limit=2"
```

---

## 2. Local development (host processes, Docker only for PostgreSQL)

Requirements: Node ≥ 20.19 and pnpm 11 (`corepack enable`).

```bash
pnpm install                      # or: pnpm setup
docker compose up -d postgres     # database only, host port 5432
pnpm db:migrate                   # apply apps/api/drizzle/*.sql
pnpm db:seed                      # demo users, relief points and check-ins
pnpm dev                          # API on :3000 (tsx watch) + web on :5173 (Vite HMR)
```

Or keep everything inside Docker with hot reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

(The dev override bind-mounts the source tree and runs `tsx watch` / `vite` inside the containers;
web is then on http://localhost:5173 as the Vite dev server instead of nginx.)

---

## 3. Commands

| Command                                    | Purpose                                                          |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `pnpm dev`                                 | API + web dev servers on the host                                |
| `pnpm build`                               | Build shared package, API bundle and web bundle                  |
| `pnpm typecheck`                           | `tsc --noEmit` in every workspace (builds shared first)          |
| `pnpm lint` / `pnpm lint:fix`              | Flat ESLint across the repo (config in `packages/eslint-config`) |
| `pnpm format` / `pnpm format:check`        | Prettier                                                         |
| `pnpm db:migrate`                          | Run pending Drizzle migrations                                   |
| `pnpm db:seed`                             | Idempotently insert the demo dataset                             |
| `pnpm --filter @heatshift/api db:generate` | Create a migration from schema changes                           |
| `pnpm --filter @heatshift/api db:studio`   | Browse the database with Drizzle Studio                          |
| `pnpm docker:up`                           | `docker compose up --build -d`                                   |
| `pnpm docker:down`                         | `docker compose down`                                            |

---

## 4. Environment variables

Copy `.env.example` to `.env`. **Never commit `.env`** (it is git-ignored; only `.env.example`
belongs in Git). On AWS the same names come from the ECS task definition and Secrets Manager.

| Variable                         | Used by | Default (local)                                           | Notes                                                |
| -------------------------------- | ------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`                       | api     | `development`                                             | `production` in the API image                        |
| `PORT` / `HOST`                  | api     | `3000` / `0.0.0.0`                                        |                                                      |
| `LOG_LEVEL`                      | api     | `info`                                                    | pino level                                           |
| `CORS_ORIGIN`                    | api     | `http://localhost:5173`                                   | Comma-separated list of allowed browser origins      |
| `DATABASE_URL`                   | api     | `postgres://heatshift:heatshift@localhost:5432/heatshift` | Inside Compose the host is `postgres`                |
| `MIGRATE_ON_BOOT`                | api     | `true`                                                    | Container entry behaviour                            |
| `SEED_ON_BOOT`                   | api     | `true`                                                    | Idempotent demo dataset                              |
| `POSTGRES_USER/PASSWORD/DB/PORT` | compose | `heatshift` / `heatshift` / `heatshift` / `5432`          | Consumed by the `postgres` service                   |
| `VITE_API_BASE_URL`              | web     | `http://localhost:3000`                                   | **Baked in at build time** (Vite has no runtime env) |

The API validates its environment with Zod on boot and exits with a readable list of problems
instead of half-starting.

---

## 5. API surface (this phase)

Base URL `http://localhost:3000`. Contracts live in `packages/shared` as Zod schemas and are used
by both the API (request validation, `/health` response check) and the web client (response
parsing), so they cannot silently drift.

| Method | Path                        | Purpose                                                                 |
| ------ | --------------------------- | ----------------------------------------------------------------------- |
| `GET`  | `/health`                   | Liveness + database status (used by Docker/AWS LB)                      |
| `GET`  | `/api/v1/relief-points`     | List relief points. Query: `type`, `verifiedOnly`, `limit`              |
| `POST` | `/api/v1/check-ins`         | Record a worker check-in (`okay`, `need_water`, `need_break`, `unwell`) |
| `GET`  | `/api/v1/check-ins/summary` | Aggregated team status. Query: `userId`, `windowHours`                  |
| `POST` | `/api/v1/heat-risk/preview` | Heat-strain score + work/rest/hydration plan                            |

Errors use one envelope: `{ "error": { "code", "message", "details?" } }`.

```bash
curl -s -X POST localhost:3000/api/v1/heat-risk/preview \
  -H 'content-type: application/json' \
  -d '{"temperatureC":41,"humidityPercent":28,"windSpeedKmh":12,"sunExposure":"full_sun",
       "hoursInShift":9,"workType":"delivery_rider","waterAccess":"limited","shadeAccess":"none"}'
```

**No weather provider is wired up.** `heat-risk/preview` receives the observation from the caller
(preset buttons in the UI), and `apps/api/src/modules/weather/weather.contract.ts` documents the
interface a free provider will implement later. The API never fakes live data.

Full request/response detail: [`docs/api-contract.md`](docs/api-contract.md).

---

## 6. Repository layout

```
heatshift/
├── apps/
│   ├── api/          Fastify 5 + Drizzle + PostgreSQL (tsup bundle, tsx dev)
│   │   └── src/
│   │       ├── config/env.ts        Zod-validated environment
│   │       ├── db/                  client, schema/, migrate.ts, seed.ts
│   │       ├── modules/             health, heat-risk, weather (contract only),
│   │       │                        relief-points, check-ins
│   │       ├── plugins/             cors, error-handler
│   │       └── app.ts / server.ts   app factory / boot + graceful shutdown
│   └── web/          React 19 + Vite 7 + Tailwind 3 + React Router 7 + PWA
│       └── src/
│           ├── app/                 App, router, providers
│           ├── features/            onboarding, heat-risk, relief-points,
│           │                        check-ins, coordinator
│           ├── components/          ui/ layout/ shared/
│           ├── hooks/  lib/  pages/ styles/
│           └── public/              manifest.webmanifest, icons/, robots.txt
├── packages/
│   ├── shared/       Zod schemas, inferred types, domain constants
│   └── eslint-config Flat ESLint config reused by every workspace
├── infra/aws/        Documentation-only AWS notes (no IaC yet)
├── docs/             product, architecture, api-contract, aws-deployment-plan, demo-script
├── docker-compose.yml      postgres + api + web (production-style images)
└── docker-compose.dev.yml  hot-reload overrides
```

### Data model

`users` → `worker_profiles` (1:1), `check_ins` (1:N). `relief_points` is standalone.
No authentication: every request uses the mock worker identity exported as `MOCK_WORKER_ID` from
`packages/shared`. See `apps/api/src/db/schema/` and `docs/architecture.md`.

### Demo data

`pnpm db:seed` inserts 5 users (4 workers + 1 coordinator), 8 Delhi relief points and 8 check-ins.
Every response that can contain seeded rows carries `meta.demo = true`, and the UI prints
“Demo data — seeded Delhi dataset, not field-verified” wherever those rows appear. Coordinates are
approximate public-place centroids; they are **not** verified field data.

---

## 7. Intended AWS architecture (nothing is deployed yet)

| Local component         | AWS target                              | Why                                              |
| ----------------------- | --------------------------------------- | ------------------------------------------------ |
| `web` (nginx container) | S3 + CloudFront (or Amplify Hosting)    | Static SPA, CDN edge caching, free HTTPS         |
| `api` (container)       | ECS Fargate behind an ALB, image in ECR | Same Dockerfile you run locally; no server admin |
| `postgres` container    | RDS PostgreSQL                          | Managed backups, patching, snapshots             |
| `.env`                  | Task-definition env + Secrets Manager   | Secrets never live in Git or the image           |
| Uploaded images (later) | S3                                      | Off the API process                              |

Step-by-step mapping, phases, IAM summary and rollback plan:
[`docs/aws-deployment-plan.md`](docs/aws-deployment-plan.md) and
[`infra/aws/architecture.md`](infra/aws/architecture.md).

---

## 8. Quality gates

`.github/workflows/ci.yml` runs: `pnpm install --frozen-lockfile` → build shared → lint →
format check → typecheck → build → both Docker images → a Compose smoke test that asserts
`/health` is green, relief points come back flagged as demo data, and the web shell serves HTML.

## 9. Troubleshooting

| Symptom                                   | Fix                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `port is already allocated` (5173/3000)   | `docker compose down`; or stop the host `pnpm dev`                                                     |
| Web shows “API unreachable”               | `docker compose ps`, then `docker compose logs api`                                                    |
| `relation "relief_points" does not exist` | Run from `apps/api` (migrations resolve `./drizzle` from cwd) or `pnpm db:migrate`                     |
| Changed schema, nothing happened          | `pnpm --filter @heatshift/api db:generate` then `pnpm db:migrate`                                      |
| Stale container after editing Dockerfile  | `docker compose build --no-cache api && docker compose up -d`                                          |
| Old UI after rebuilding the web image     | The PWA service worker precached the previous build — reload once more, or clear site data in DevTools |

## 10. Deliberately out of scope for this phase

Accounts and auth, live weather provider, map tiles, offline write-sync, push/SMS alerts,
AI features, coordinator scheduling, paid APIs.
