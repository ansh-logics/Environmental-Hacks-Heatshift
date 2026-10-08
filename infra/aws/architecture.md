# HeatShift — Target AWS Architecture (Design Only)

**Status: not deployed.** No AWS resources for HeatShift exist. This document is the
design target that `docs/aws-deployment-plan.md` phases towards, and this folder
holds no runnable IaC (see `README.md` in this directory). Any component diagrammed
here is prospective. The Delhi relief dataset that would ship with the app is
**demo data**.

## 1. Topology (staging/production shape)

```
                          Internet users (workers, coordinators)
                                     |
                 ---------------------------------------------
                 |                                           |
                 v                                           v
        +-----------------+                        +--------------------+
        |   CloudFront    |                        |  Application Load  |
        |  (HTTPS, CDN,   |                        |  Balancer          |
        |   caching, ACM  |                        |  (public subnets,  |
        |   cert)         |                        |   TLS :443)        |
        +--------+--------+                        +---------+----------+
                 |                                            |
                 | s3:GetObject (via OAC)                     | target group:
                 v                                            | health check GET /health
        +-----------------+                                   v
        |  S3 bucket      |                        +--------------------+
        |  web bundle     |                        | ECS Fargate        |
        |  (PWA: html/    |                        | service            |
        |  js/css/manifest|                        | (private subnets)  |
        |  /sw.js)        |                        | heatshift-api image|
        +-----------------+                        +---------+----------+
                                                             |
              task exec role reads <-------------------------|-----+
              Secrets Manager + SSM                             |  |
                                                                v  |
        +----------------------------+            +------------------------+
        | Secrets Manager            |            | RDS PostgreSQL         |
        |  /heatshift/<stage>/       |            | (private subnets)      |
        |   DATABASE_URL             |            | SG: 5432 ONLY from the |
        | SSM Parameter Store        |            |     API service SG     |
        |  /heatshift/<stage>/*      |            | multi-AZ: optional     |
        +----------------------------+            +------------------------+

        Images: ECR (private)  <--- pushed by GitHub Actions via OIDC
        deploy role; one-off ECS task runs migrations against RDS
        before a service deploy.

   (VPC: 2 AZs, public subnets = ALB only; private subnets = Fargate + RDS.
    Low-ops alternative: swap "ALB + Fargate" for AWS App Runner, which
    manages networking/TLS for the same ECR image.)
```

## 2. Component roles

| Component           | Role in HeatShift                 | Design notes                                                                                                                                                               |
| ------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CloudFront          | Sole public entry for the web app | HTTPS-only; caches the immutable hashed assets; `sw.js` and `manifest.webmanifest` served no-cache so app updates are not delayed by TTL.                                  |
| S3 (web bucket)     | Hosts the static Vite build       | SPA fallback to `index.html` (subroutes like `/dashboard` must resolve). Block Public Access; CloudFront is the only reader.                                               |
| ALB                 | Public entry for the API          | 443 listener with ACM cert; target-group health check hits the existing `GET /health`, which already proves DB reachability (`SELECT 1`).                                  |
| ECS Fargate service | Runs the API                      | The _same image and entrypoint_ as local Docker, but with `MIGRATE_ON_BOOT=false` and `SEED_ON_BOOT=false`; desired count small (1–2); Fargate Spot acceptable on staging. |
| ECR (private)       | Image registry                    | Immutable git-SHA tags; CI (Phase 1) is the only pusher.                                                                                                                   |
| RDS PostgreSQL      | System of record                  | No public IP; security group admits 5432 **only** from the API service's SG. Automated backups + manual snapshot before each migration one-off.                            |
| Secrets Manager     | `DATABASE_URL`                    | Injected as a container env var by the task definition; the app's Zod env validation is unchanged.                                                                         |
| SSM parameters      | Non-secret config                 | `LOG_LEVEL`, origins, flags per stage.                                                                                                                                     |

## 3. Request-flow walkthroughs

### 3.1 Cold start of the API container

```
Deploy/update-service
  -> ECS pulls heatshift-api:<git-sha> from private ECR
     (task execution role: ecr GetAuthorizationToken + pull)
  -> Task reads env: plain vars from task definition,
     DATABASE_URL from Secrets Manager, LOG_LEVEL from SSM
     (execution-role permissions only; app code never calls
      Secrets Manager directly)
  -> Container starts: node dist/server.js
     -> Zod env module validates config; invalid config = exit now,
        task fails, deploy stalls visibly (desired behaviour)
     -> Fastify listens on PORT/HOST
  -> ALB target-group health check GET /health
     -> handler runs SELECT 1 against RDS (crosses AZ to private subnet,
        allowed by SG chain ALB->API->RDS)
     -> 200 { status: "ok", checks.database: "ok" }
  -> Target healthy -> traffic shifts. Cold start is dominated by image
     pull on first launch; subsequent deploys reuse node cache.
```

Migrations are **not** part of this path: they ran moments earlier as an ECS
one-off task (`node dist/migrate.js`) before the service was updated — see
`docs/aws-deployment-plan.md` §9.

### 3.2 A rider posts a check-in

```
Rider phone (LTE, PWA on https://heatshift.app served by CloudFront)
  taps "Need water" on /dashboard
  -> fetch POST https://api.heatshift.app/api/v1/check-ins
     (cross-origin: browser sends the JSON POST; ALB TLS-terminates,
      Fastify CORS plugin answers preflight because web/API are separate
      origins; CORS_ORIGIN whitelists the CloudFront origin exactly)
  -> ALB routes to a healthy Fargate target
  -> Zod (shared schema) validates body { userId, status, lat?, lng? }
  -> Drizzle INSERT INTO check_ins ... RETURNING *
     (postgres.js pool over TCP to RDS in the private subnet)
  -> 201 with the created row; ALB counts it; CloudFront is not involved
     (API responses are not cached).
Latency budget: one HTTPS round trip + one indexed insert — fine on low-end
Android over LTE; the app shows the offline banner only if /health or the
post fails.
```

### 3.3 A coordinator views the summary

```
Coordinator opens https://heatshift.app/coordinator
  -> index.html + hashed JS come from CloudFront edge cache (hit),
     bundle already contains the baked VITE_API_BASE_URL for this stage
  -> page mounts, calls GET https://api.heatshift.app/api/v1/check-ins/summary
  -> ALB -> Fargate target
  -> Zod validates query (userId?/limit?), Drizzle runs the 24h aggregation
     (totals per status + recent N rows) against RDS
  -> JSON back; totals render; the rider check-in from 3.2 is visible
     within one refresh.
Read path shares the same single Fargate service — at this scale a
separate read tier would be pure ceremony.
```

## 4. Cross-cutting design decisions

- **Same artifact, same behaviour:** the only behavioural delta between local and
  AWS is `MIGRATE_ON_BOOT`/`SEED_ON_BOOT` flipped off in the task definition.
  Everything else — image, entrypoint, env validation, health endpoint — is
  identical, which is what makes staging→prod a promotion instead of a rewrite.
- **Least privilege:** no IAM permissions for end users exist (no auth in this
  phase); all IAM here is machine identity (CI OIDC role, task execution role; the
  task role is empty today).
- **Single AZ-first:** staging runs one AZ, small instances, no NAT; production
  adds multi-AZ RDS only if budget justifies it. Full cost rationale in
  `docs/aws-deployment-plan.md` §8.
- **Demo integrity:** responses carrying relief points keep `meta.demo = true`
  even in AWS; the deployment does not silently launder demo data into "real"
  data. The verification workflow that flips `verified` is a post-deploy product
  feature, not an infrastructure step.

## 5. Rollback (summary; details in the deployment plan §11)

- API: redeploy the previous ECS service revision (git-SHA-pinned images).
- Web: previous release prefix in S3 + CloudFront re-point/invalidate.
- DB: expand/contract migrations mean the prior API revision keeps running
  against the migrated schema; code rollback ≠ schema rollback.
