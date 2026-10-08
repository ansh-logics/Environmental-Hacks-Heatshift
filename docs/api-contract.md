# HeatShift — API Contract

Base URL (local): `http://localhost:3000`. All versioned endpoints live under
`/api/v1`. Every request body, query string and response is validated with Zod
schemas defined in `packages/shared` — that package is the single source of truth;
this document mirrors it.

## 1. Conventions

### 1.1 Versioning

- All data endpoints are prefixed `/api/v1`. Breaking changes (removed fields,
  changed types, redefined semantics) require `/api/v2`; additive optional fields
  and new endpoints are non-breaking and stay within `v1`.
- `GET /health` is intentionally unversioned: it is infrastructure (container
  health checks, CI, the web connectivity card) and must never break with API
  version churn.

### 1.2 Content type and parsing

- Requests and responses are `application/json; charset=utf-8`.
- Unknown body fields are rejected (`strict()` object schemas) so client and server
  drift is caught at the boundary, not silently ignored.

### 1.3 Error envelope

Fastify's custom error handler serialises every failure — validation, not-found,
internal — into one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body validation failed",
    "details": [
      {
        "path": "status",
        "message": "Invalid option: expected one of \"okay\"|\"need_water\"|\"need_break\"|\"unwell\""
      }
    ]
  }
}
```

| HTTP status | `code`                | Meaning                                                                           |
| ----------- | --------------------- | --------------------------------------------------------------------------------- |
| 400         | `VALIDATION_ERROR`    | Body/query/params failed Zod validation. `details[]` present.                     |
| 404         | `NOT_FOUND`           | Unknown route or missing resource.                                                |
| 422         | `UNPROCESSABLE`       | Syntactically valid but semantically rejected (e.g. out-of-range weather inputs). |
| 500         | `INTERNAL_ERROR`      | Unhandled server failure. `message` is generic; no stack leak.                    |
| 502         | `WEATHER_UNAVAILABLE` | The upstream weather provider was unreachable, errored, or sent unusable data.    |
| 503         | `WEATHER_UNAVAILABLE` | The provider did not answer within the 6 s budget; retry shortly.                 |

Rules: `code` is a stable machine-readable SCREAMING_SNAKE_CASE string; `message`
is human-readable and safe to show; `details` is optional and only present when
there is structured information (validation issues). Error responses never carry
`meta`.

### 1.4 Demo data marker

Responses that include seeded relief-point data carry `meta.demo = true`. The
seeded Delhi relief dataset is **demo data**: entries are illustrative, not
verified physical locations. Clients must surface this (the web app labels the
relief screens accordingly).

Weather is **not** demo data. `GET /api/v1/weather/conditions` and
`POST /api/v1/heat-risk/live` return real Open-Meteo observations, and a provider
failure is reported as one rather than being filled in with invented numbers. The
distinction the UI has to keep straight is that a real base map under demo
markers is still demo markers.

---

## 2. `GET /health`

Liveness/readiness for humans, the web connectivity card and Docker health checks.
Unversioned.

- Request: none.
- Response `200`:

```json
{
  "status": "ok",
  "service": "heatshift-api",
  "version": "0.1.0",
  "uptimeSeconds": 42.7,
  "checks": {
    "database": { "status": "ok", "latencyMs": 2.1 }
  }
}
```

| Field                       | Type                 | Notes                             |
| --------------------------- | -------------------- | --------------------------------- |
| `status`                    | `"ok" \| "degraded"` | `degraded` when any check fails.  |
| `service`                   | string               | Fixed: `heatshift-api`.           |
| `version`                   | string               | Package version.                  |
| `uptimeSeconds`             | number               | Process uptime.                   |
| `checks.database.status`    | `"ok" \| "error"`    | Real `SELECT 1`, not a TCP guess. |
| `checks.database.latencyMs` | number \| null       | Null when status is `error`.      |

- If the database is unreachable the endpoint still answers (with `degraded`) so
  the container is not killed for a dependency blip; Compose healthcheck tolerates
  `degraded` for a bounded window.

---

## 3. `GET /api/v1/relief-points`

List relief locations (water, shade, clinics, cooling spaces, canteens). Results
come from the seeded dataset — **demo data**, flagged by `meta.demo`. When the
request carries a position, each row also carries its straight-line distance and
the list comes back nearest-first.

### Query parameters (all optional)

| Param          | Type                                                          | Default   | Constraints                                                  |
| -------------- | ------------------------------------------------------------- | --------- | ------------------------------------------------------------ |
| `type`         | one of `water`, `shade`, `clinic`, `cooling_space`, `canteen` | all types | Single value; comma-separated lists are not supported in v1. |
| `verifiedOnly` | boolean                                                       | `false`   | Parsed from `"true"`/`"false"` strings.                      |
| `limit`        | integer                                                       | `50`      | 1–200.                                                       |
| `latitude`     | number                                                        | —         | −90 to 90. Must be sent together with `longitude`.           |
| `longitude`    | number                                                        | —         | −180 to 180. Must be sent together with `latitude`.          |

`latitude`/`longitude` are the caller's position, not a filter: every point in the
city is still a candidate, just re-ranked by how far it is. Sending one without the
other is a `400`, because a lone coordinate is not usable.

### Response `200`

```json
{
  "data": [
    {
      "id": "8f2c1e9a-4b7d-4a10-9c3f-2d5e6a7b8c9d",
      "name": "Drinking water point - Connaught Place",
      "type": "water",
      "latitude": 28.6315,
      "longitude": 77.2167,
      "address": "Near Inner Circle, New Delhi",
      "verified": true,
      "openingHours": "07:00-20:00",
      "createdAt": "2026-10-08T04:00:00.000Z",
      "distanceKm": 0.042
    }
  ],
  "count": 1,
  "meta": { "demo": true, "source": "Delhi demo seed (2026-05) — positions are approximate" }
}
```

`data[]` items follow the `relief_points` shape: `id` (uuid), `name` (string),
`type` (enum above), `latitude`/`longitude` (number, WGS84), `address` (string),
`verified` (boolean), `openingHours` (string), `createdAt` (ISO 8601).

| Field        | Type    | Notes                                                                                                     |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------- |
| `distanceKm` | number? | Haversine (straight-line) km from the request position, 3 decimals. **Absent** when no position was sent. |
| `count`      | integer | Rows returned, at the top level next to `data`.                                                           |
| `meta.demo`  | `true`  | Always present for this endpoint — the dataset is seeded.                                                 |

Ordering without a position is verified-points-first then by name; with a position it
is ascending `distanceKm`. Distances are geometry, not a routing estimate, and the
points they are measured to are demo entries.

### Errors

- `400 VALIDATION_ERROR` — bad `type`, non-boolean `verifiedOnly`, `limit` outside
  1–200, out-of-range coordinate, or `latitude`/`longitude` sent separately.

---

## 4. `POST /api/v1/check-ins`

Create a one-tap worker status check-in. Mock identity: `userId` is supplied by the
client (seeded user UUID) because authentication is out of scope this phase.

### Request body

| Field       | Type                                                 | Required | Constraints                            |
| ----------- | ---------------------------------------------------- | -------- | -------------------------------------- |
| `userId`    | uuid string                                          | yes      | Must reference an existing `users.id`. |
| `status`    | `"okay" \| "need_water" \| "need_break" \| "unwell"` | yes      | Enum.                                  |
| `latitude`  | number                                               | no       | −90 to 90 when present.                |
| `longitude` | number                                               | no       | −180 to 180 when present.              |

```json
{
  "userId": "3b9f6b2e-1c4a-4f5e-8d7b-0a2c4e6f8a11",
  "status": "need_water",
  "latitude": 28.6129,
  "longitude": 77.2295
}
```

### Response `201`

```json
{
  "data": {
    "id": "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
    "userId": "3b9f6b2e-1c4a-4f5e-8d7b-0a2c4e6f8a11",
    "status": "need_water",
    "latitude": 28.6129,
    "longitude": 77.2295,
    "createdAt": "2026-10-08T09:15:00.000Z"
  }
}
```

### Errors

- `400 VALIDATION_ERROR` — missing/unknown fields, bad enum, out-of-range coords,
  malformed uuid.
- `422 UNPROCESSABLE` — `userId` is well-formed but unknown; coordinates provided
  for only one of latitude/longitude.
- `500 INTERNAL_ERROR` — insert failure.

---

## 5. `GET /api/v1/check-ins/summary`

Aggregate view for the coordinator screen: totals per status over the trailing 24
hours plus the most recent check-ins.

### Query parameters (all optional)

| Param    | Type    | Default | Notes                                                                                                                                           |
| -------- | ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `userId` | uuid    | —       | Scope the summary to a single worker (dashboard personal card). Omit for the team aggregate; the endpoint is city-less by design in this phase. |
| `limit`  | integer | `10`    | Recent-item count, 1–50.                                                                                                                        |

### Response `200`

```json
{
  "data": {
    "window": {
      "since": "2026-10-07T09:15:00.000Z",
      "until": "2026-10-08T09:15:00.000Z"
    },
    "totals": {
      "okay": 34,
      "need_water": 11,
      "need_break": 6,
      "unwell": 2
    },
    "total": 53,
    "recent": [
      {
        "id": "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
        "userId": "3b9f6b2e-1c4a-4f5e-8d7b-0a2c4e6f8a11",
        "userName": "Rider Demo User",
        "status": "need_water",
        "latitude": 28.6129,
        "longitude": 77.2295,
        "createdAt": "2026-10-08T09:12:00.000Z"
      }
    ]
  }
}
```

- `totals` always contains all four keys, zero-filled.
- `recent[]` is newest-first and limited by `limit`; items match the created
  check-in shape plus denormalised `userName` for rendering.

### Errors

- `400 VALIDATION_ERROR` — malformed `userId`, `limit` out of range.
- `500 INTERNAL_ERROR` — the query failed (database unreachable). `/health` reports
  the same condition as `degraded` rather than failing.

---

## 6. `POST /api/v1/heat-risk/preview`

Compute the personal heat-risk score and work/rest/hydration plan from weather the
caller supplies. This is the manual path the dashboard uses when a worker would
rather type their city and shift answers than share a position; §8 is the same
model fed by live observations.

### Request body (all fields required unless noted)

| Field             | Type                                                                                                   | Required | Constraints                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------- |
| `temperatureC`    | number                                                                                                 | yes      | −10 to 60                                                         |
| `humidityPercent` | number                                                                                                 | yes      | 0 to 100                                                          |
| `windSpeedKmh`    | number                                                                                                 | yes      | 0 to 150                                                          |
| `sunExposure`     | `"full_sun" \| "partial_shade" \| "deep_shade" \| "indoor"`                                            | yes      | Enum; the worker's own answer about what they are standing under. |
| `hoursInShift`    | number                                                                                                 | yes      | 0.5 to 16                                                         |
| `workType`        | `"delivery_rider" \| "security_guard" \| "construction" \| "street_vendor" \| "sanitation" \| "other"` | yes      | Enum; sets the model's work-intensity multiplier.                 |
| `waterAccess`     | `"none" \| "limited" \| "reliable"`                                                                    | yes      | —                                                                 |
| `shadeAccess`     | `"none" \| "limited" \| "reliable"`                                                                    | no       | Defaults to `limited`.                                            |
| `acclimatized`    | boolean                                                                                                | no       | Defaults to `true`.                                               |

```json
{
  "temperatureC": 38,
  "humidityPercent": 45,
  "windSpeedKmh": 8,
  "sunExposure": "full_sun",
  "hoursInShift": 8,
  "workType": "delivery_rider",
  "waterAccess": "limited",
  "shadeAccess": "none",
  "acclimatized": true
}
```

### Response `200`

```json
{
  "data": {
    "wbgtC": 37.8,
    "score": 100,
    "level": "severe",
    "label": "Severe risk",
    "headline": "Stop non-essential work. Find shade, water or a cooling space now.",
    "plan": {
      "workMinutesPerCycle": 15,
      "restMinutesPerCycle": 45,
      "waterMlPerHour": 1050,
      "maxRecommendedShiftMinutes": 120,
      "unsafeStartHour": 11,
      "advice": [
        "Work 15 minutes, then rest 45 minutes in shade. Repeat every hour.",
        "Drink about 1050 ml of water per hour; do not wait until you are thirsty.",
        "Your planned shift is 9.0 h. Cap it at 2.0 h or split it around 11:00",
        "Avoid starting after 11:00 — that is the hottest part of the day.",
        "Use ORS/salt and light full-sleeve clothing; a wet cloth on the neck helps.",
        "Move to a cooling space or clinic if you feel dizzy, sick or stop sweating."
      ]
    },
    "factors": [
      {
        "factor": "Wet-bulb temperature",
        "impact": "26.6 C at 28% humidity"
      },
      {
        "factor": "Sun and wind at the work spot",
        "impact": "full sun, 12 km/h wind"
      },
      {
        "factor": "Work intensity",
        "impact": "0.90 x resting heat load"
      },
      {
        "factor": "Water and shade access",
        "impact": "water limited, shade none"
      }
    ],
    "input": {
      "...": "echo of the validated request body"
    },
    "meta": {
      "demo": true,
      "source": "HeatShift WBGT model v0.1 with caller-supplied observations"
    }
  }
}
```

| Field                                              | Type                                        | Notes                                                                                     |
| -------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `wbgtC`                                            | number                                      | Simplified WBGT estimate, 1 decimal (see architecture §6).                                |
| `score`                                            | integer 0–100                               | Monotonic in WBGT; UI-facing severity dial.                                               |
| `level`                                            | `"low" \| "moderate" \| "high" \| "severe"` | WBGT bands: ≤28 low, 28–30 moderate, 30–32.5 high, >32.5 severe.                          |
| `label`                                            | string                                      | Human-readable level text.                                                                |
| `headline`                                         | string                                      | One-sentence instruction shown under the score.                                           |
| `factors[]`                                        | `{ factor, impact }`                        | "Why this score" rows, rendered in a `<details>` block.                                   |
| `input`                                            | object                                      | Echo of the validated request (defaults applied).                                         |
| `meta`                                             | `{ demo: true, source }`                    | Says which model ran and that the observations were supplied by the caller, not observed. |
| `plan.workMinutesPerCycle` / `restMinutesPerCycle` | integer ≥ 0                                 | Baseline per level, modified by intensity, water/shade access and acclimatisation.        |
| `plan.waterMlPerHour`                              | integer                                     | Hydration target.                                                                         |
| `plan.maxRecommendedShiftMinutes`                  | integer                                     | Ceiling for today's exposure.                                                             |
| `plan.unsafeStartHour`                             | integer 0–23                                | Local hour after which starting the shift is unsafe at this level.                        |
| `plan.advice`                                      | string[]                                    | Plain-language bullets, rendered directly by the UI.                                      |

### Errors

- `400 VALIDATION_ERROR` — any field missing/out of range. `details[]` points at
  the offending path (envelope and example in §1.3).
- `422 UNPROCESSABLE` — internally inconsistent inputs (reserved; e.g. future
  checks like impossible humidity/temperature combinations).

---

## 7. `GET /api/v1/weather/conditions`

Real, current conditions for one position, fetched from Open-Meteo by our API. No
key is required by the provider, and none is exposed to clients.

### Query parameters

| Param       | Type   | Required | Constraints |
| ----------- | ------ | -------- | ----------- |
| `latitude`  | number | yes      | −90 to 90   |
| `longitude` | number | yes      | −180 to 180 |

### Response `200`

```json
{
  "data": {
    "temperatureC": 30.2,
    "humidityPercent": 55,
    "windSpeedKmh": 7.2,
    "cloudCoverPercent": 3,
    "sunExposure": "full_sun",
    "observedAt": "2026-10-08T13:15:00.000Z",
    "provider": "open-meteo",
    "location": { "latitude": 28.5764, "longitude": 77.1868 },
    "freshness": {
      "provider": "open-meteo",
      "fetchedAt": "2026-10-08T13:16:33.684Z",
      "observedAt": "2026-10-08T13:15:00.000Z",
      "ageSeconds": 0,
      "cacheTtlSeconds": 600,
      "cached": false,
      "cacheCell": "28.6,77.2",
      "cacheScope": "per-process"
    },
    "source": "Live weather via Open-Meteo"
  }
}
```

| Field                  | Type                       | Notes                                                                                                      |
| ---------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `cloudCoverPercent`    | number \| null             | Null when the provider has no cloud reading for the grid point.                                            |
| `sunExposure`          | enum, as §6                | **Derived** from cloud cover (<20 % full sun, <70 % partial, else deep shade). A hint, not an observation. |
| `observedAt`           | ISO 8601 (UTC)             | The provider reports local wall-clock; the offset it returns is applied so this is a true instant.         |
| `location`             | `{ latitude, longitude }`  | The provider's own grid point (~0.25°), which is not the position that was asked for.                      |
| `freshness.cached`     | boolean                    | Served from this process's memory rather than a fresh upstream call.                                       |
| `freshness.cacheCell`  | string, e.g. `"28.6,77.2"` | The coarse 0.1° cache bucket. Never the exact coordinates.                                                 |
| `freshness.cacheScope` | `"per-process"`            | A literal, so clients can see the limitation rather than assume a shared cache.                            |

### Errors

- `400 VALIDATION_ERROR` — missing or out-of-range coordinate.
- `502 WEATHER_UNAVAILABLE` — provider unreachable, non-2xx, or a payload that did
  not parse. `message` says which, and no numbers are invented.
- `503 WEATHER_UNAVAILABLE` — provider did not answer within 6 s.

---

## 8. `POST /api/v1/heat-risk/live`

The same model as §6, fed by §7. The caller sends a position plus the worker's
profile; the server fetches the observation. This is what the dashboard runs when a
worker presses "Use my location for live heat risk".

### Request body

Identical to §6 **minus** `temperatureC`, `humidityPercent` and `windSpeedKmh`,
**plus** the position:

| Field         | Type   | Required | Constraints                                                                        |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------------- |
| `latitude`    | number | yes      | −90 to 90                                                                          |
| `longitude`   | number | yes      | −180 to 180                                                                        |
| `sunExposure` | enum   | yes      | The worker's own answer wins over the cloud-derived hint.                          |
| …             |        |          | `hoursInShift`, `workType`, `waterAccess`, `shadeAccess`, `acclimatized` as in §6. |

```json
{
  "latitude": 28.5494,
  "longitude": 77.2632,
  "sunExposure": "full_sun",
  "hoursInShift": 8,
  "workType": "delivery_rider",
  "waterAccess": "limited",
  "shadeAccess": "none",
  "acclimatized": true
}
```

### Response `200`

`data` is the §6 shape (`wbgtC`, `score`, `level`, `label`, `headline`, `plan`,
`factors`, `input`) with four provenance fields instead of `meta`:

```json
{
  "data": {
    "...": "the heat-risk result fields from §6",
    "weather": { "...": "the §7 data object, verbatim" },
    "coordinates": { "latitude": 28.5494, "longitude": 77.2632 },
    "source": "Live weather via Open-Meteo",
    "model": "HeatShift WBGT model v0.1"
  }
}
```

| Field         | Type   | Notes                                                                                                    |
| ------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `weather`     | object | Exactly what §7 returns, so the UI can show the observation the plan was built from.                     |
| `coordinates` | object | The position that was queried — the client's, not the provider's grid snap (that is `weather.location`). |
| `source`      | string | Where the numbers came from. Rendered next to the plan.                                                  |
| `model`       | string | That the weather is live does not make the maths anything other than the documented heuristic.           |

`input` echoes the observation and profile the model actually received, so a
response is auditable on its own. There is deliberately **no `meta.demo`** here: the
weather is real. Relief points stay demo data and say so through their own endpoint.

### Errors

- `400 VALIDATION_ERROR` — §6's rules plus a missing or out-of-range position.
- `502` / `503` `WEATHER_UNAVAILABLE` — as §7. The plan is not computed at all.

---

## 9. Endpoint summary

| Method | Path                         | Purpose                                             | Auth                  |
| ------ | ---------------------------- | --------------------------------------------------- | --------------------- |
| GET    | `/health`                    | Service + database status                           | none                  |
| GET    | `/api/v1/relief-points`      | Filterable relief list, optionally distance-ordered | none                  |
| POST   | `/api/v1/check-ins`          | Create check-in (mock identity)                     | none (userId in body) |
| GET    | `/api/v1/check-ins/summary`  | 24 h totals + recent, optionally per user           | none                  |
| POST   | `/api/v1/heat-risk/preview`  | Risk score + plan from supplied weather inputs      | none                  |
| GET    | `/api/v1/weather/conditions` | Live Open-Meteo observation for a position          | none                  |
| POST   | `/api/v1/heat-risk/live`     | Risk score + plan from live weather at a position   | none                  |

No endpoint requires credentials in this phase; authentication is a non-goal and
arranges itself in front of `check-ins` and `relief-points` write paths later. The
two weather endpoints are unauthenticated too, which is acceptable while they are
read-only and rate-limited only by the caller's own interest — a public deployment
would need throttling before anything else.

## 10. Contract evolution notes

- `GET /api/v1/weather/conditions` and `POST /api/v1/heat-risk/live` were the
  additive change this phase, exactly as previously forecast in this section. The
  caller-supplied-inputs mode of §6 stayed untouched, so no existing client changed.
- A shared (Redis) weather cache would let `freshness.cacheScope` grow a second
  value; clients should treat that field as informational, not assert on it.
- Any response gaining fields is additive and v1-safe; any field changing type or
  disappearing is a v2 event.
