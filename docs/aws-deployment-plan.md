# HeatShift — AWS Deployment Plan

Status: **planning document only.** Nothing has been deployed. The current phase is
foundation (local Docker + CI image builds). This document is the authoritative
mapping for when deployment work starts. The seeded Delhi relief dataset this plan
would ship is **demo data**; production launch requires verified content first.

## 1. Principles

1. **Deployment parity.** The images CI already builds (`api`, `web`) are the
   artifacts that ship. AWS changes _where_ they run, not _what_ they are.
2. **Lowest ops surface that is still real.** Fargate + ALB + RDS, not ECS
   Anywhere, not Kubernetes. App Runner is a legitimate even-lower-ops substitute
   where its constraints fit.
3. **Cost-aware by default.** This is a hackathon-scale workload; every service
   choice below has a cheap mode noted in §8.
4. **Documented now, IaC later.** `infra/aws/` is documentation-only until the
   phase that writes Terraform/CDK begins (see `infra/aws/README.md`).

## 2. Component mapping

| Local component                                      | AWS service                                                                                  | Why                                                                                                                                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web` container (nginx serving Vite build)           | **S3 (static hosting) + CloudFront**                                                         | The PWA is a pure static bundle; S3+CloudFront is near-zero cost, globally cached, and HTTPS by default. No origin compute needed for the frontend.                                           |
| `web` container (alternative)                        | **Amplify Hosting**                                                                          | Simpler alternative: connect the repo, it builds and hosts the Vite output with PR previews. Choose when we want zero pipeline work for the frontend.                                         |
| `api` container (Fastify)                            | **ECS Fargate service behind an Application Load Balancer**                                  | Runs the exact same image and boot script as local; ALB gives health checks, TLS termination upstream, and target-draining deploys.                                                           |
| `api` container (alternative)                        | **AWS App Runner**                                                                           | Low-ops alternative: image in, HTTPS service out, autoscale to zero-ish. Trade-offs: less network control (no private subnets), request-size/time limits — acceptable for this API's profile. |
| API images                                           | **ECR (private)**                                                                            | One private repository per image; immutable image tags from CI.                                                                                                                               |
| `postgres` container                                 | **RDS PostgreSQL**                                                                           | Managed backups, patching, snapshots. Multi-AZ optional (off for hackathon, on for production).                                                                                               |
| `DATABASE_URL` + credentials                         | **Secrets Manager**                                                                          | Rotatable secret; injected into the task as an env var via the task definition.                                                                                                               |
| Non-secret config (`LOG_LEVEL`, flags)               | **SSM Parameter Store**                                                                      | Plain parameters, no rotation story needed.                                                                                                                                                   |
| Future uploads (worker photos, verified-site images) | **S3 bucket (separate from hosting)**                                                        | Never on ephemeral container disk; presigned uploads later.                                                                                                                                   |
| Docker Compose health checks                         | **ALB target-group health checks / App Runner health check + CloudWatch container insights** | Same `/health` endpoint is the probe in both worlds.                                                                                                                                          |
| Local env file                                       | **Task definition env + Secrets Manager + SSM**                                              | Parity table in §5.                                                                                                                                                                           |

## 3. Phased plan

### Phase 0 — Local (complete in this foundation phase)

- `docker compose up --build`: Postgres + API + web, health checks, boot-time
  migrate + idempotent seed.
- No AWS involvement.

### Phase 1 — CI builds deployable artifacts (no deploy)

- Extend the existing workflow so, _after_ the current stages
  (install → build shared → lint → typecheck → build → docker build) succeed on
  the main branch:
  1. Authenticate to ECR via the OIDC deploy role (§6).
  2. Build and push `heatshift-api:<git-sha>` (and later the web bundle to S3).
- Gate: this phase still deploys nothing; it proves images are pull-ready.

### Phase 2 — Staging

- Provision: VPC (public + private subnets, §7), ECR repos, RDS PostgreSQL
  (single-AZ, smallest instance), ECS cluster, ALB, Fargate service, CloudFront
  with an S3 staging origin.
- Deploy latest `main` on merge. Migrations run as an ECS one-off (§9).
- Seed on staging: run the idempotent demo seed **once** via one-off task;
  `SEED_ON_BOOT=false` in the task env afterwards.
- Validation: full demo script (§10 of demo-script doc) against the staging URL on
  a real phone over LTE.

### Phase 3 — Production

- Same stack, promoted by image tag (deploy the exact staging-verified
  `<git-sha>`; never rebuild for prod).
- RDS multi-AZ optional; automated backups on; final snapshot on delete protected.
- CloudFront with the real domain, ACM certificate in us-east-1, origin = S3
  bucket; ALB `CORS_ORIGIN` restricted to the production origin.
- Alarm on ALB 5xx rate and RDS connections.

## 4. High-level target topology

```
Route 53 / bare CloudFront domain
        |
        v  HTTPS (ACM cert)
  CloudFront  ------>  S3 (web bundle: index.html, assets, manifest, SW)
        |
        | (API calls use https://api.<domain> -> ALB)
        v
  Application Load Balancer (public subnets)
        |  target-group health check -> GET /health
        v
  ECS Fargate service  (private subnets)   [alt: App Runner]
        |  task role reads Secrets Manager / SSM
        v
  RDS PostgreSQL  (private subnets, SG ingress only from the API service SG)
```

## 5. Environment-variable parity

| Local env var                                    | Consumer         | AWS source                                                                    | Notes                                                                                                                   |
| ------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                           | api              | Task definition (env, fixed `3000`)                                           | Plain value.                                                                                                            |
| `HOST`                                           | api              | Task definition (env, `0.0.0.0`)                                              | Plain value.                                                                                                            |
| `NODE_ENV`                                       | api              | Task definition (env, `production`)                                           | Plain value.                                                                                                            |
| `LOG_LEVEL`                                      | api              | SSM Parameter (`/heatshift/<stage>/LOG_LEVEL`)                                | Non-secret; changeable without redeploy via a one-off task refresh.                                                     |
| `MIGRATE_ON_BOOT`                                | api              | Task definition (env, **`false`** in AWS)                                     | Migrations move to an explicit one-off ECS task (§9); boot-time migration is a local-comdev convenience only.           |
| `SEED_ON_BOOT`                                   | api              | Task definition (env, **`false`** in AWS)                                     | Demo seed is staging-only, run once manually; production never seeds demo rows.                                         |
| `DATABASE_URL` (user/password/ host/db embedded) | api              | **Secrets Manager secret**, referenced in the task definition `secrets` block | ECS injects it as an env var; the app's Zod env module stays unchanged. Rotation = new secret version + service deploy. |
| `CORS_ORIGIN`                                    | api              | Task definition (env; could live in SSM)                                      | Staging: CloudFront staging origin. Production: exact production origin only.                                           |
| `VITE_API_BASE_URL`                              | web (build time) | CI build arg per stage                                                        | Baked into the JS bundle at `vite build`; switching it is a rebuild + S3 upload, **not** a runtime change.              |

Constraint worth repeating: the API's Zod-validated env module (§8 of
architecture.md) runs unchanged in the container, so any missing/mistyped AWS env
fails the task at boot — visible immediately in ECS as a failed deployment, which
is the desired behaviour.

## 6. IAM summary

Least-privilege; no access keys anywhere — GitHub Actions uses OIDC, tasks use
roles.

| Role / principal                                         | Purpose                                   | Permissions (shape)                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GitHub Actions OIDC deploy role** (`heatshift-deploy`) | Assume via OIDC from the repo's workflows | `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:CompleteLayerUpload`, `ecr:UploadLayerPart`, `ecr:InitiateLayerUpload`, `ecr:BatchImportCheckImmutability`-scoped push to the two ECR repos; `ecs:UpdateService`, `ecs:DescribeServices` (deploy only, not cluster mutation); `s3:PutObject` + `s3:DeleteObject` on the web-bucket prefix; `cloudfront:CreateInvalidation`. |
| **ECS task execution role** (`heatshift-task-exec`)      | Pull images, fetch secrets, write logs    | `ecr:GetAuthorizationToken` + pull on the repo; `secretsmanager:GetSecretValue` on the `DATABASE_URL` secret ARN only; `ssm:GetParameters` on the `/heatshift/*` path; `logs:CreateLogStream`/`PutLogEvents` on the service log group.                                                                                                                                                           |
| **ECS task role** (`heatshift-task`)                     | Runtime permissions for app code          | **None in this phase** (app talks to the DB via env-provided connection string). Future: `s3:PutObject` on the uploads bucket, `rekognition`-free by design.                                                                                                                                                                                                                                     |
| **RDS**                                                  | —                                         | No IAM role; access is SG-based. (Secrets Manager _rotation_ lambda, if enabled later, gets its own narrow role.)                                                                                                                                                                                                                                                                                |
| **CloudFront**                                           | Serve the web bucket                      | CloudFront service principal granted bucket-wide `s3:GetObject` via bucket policy (OAC); no IAM role needed.                                                                                                                                                                                                                                                                                     |

## 7. Networking

- One VPC per stage (or one VPC with separate subnet sets; hackathon scale makes a
  single small VPC per stage fine).
- **Public subnets:** ALB only (plus NAT gateway if cost justifies outbound for
  the future weather-provider call; can be omitted in staging to save ~$32/mo by
  using a public-subnet task with `awsvpc` assign-public-IP instead — documented
  trade-off).
- **Private subnets:** Fargate tasks and RDS.
- Security groups:
  - ALB SG: ingress 443 from `0.0.0.0/0` (80 redirects to 443).
  - API service SG: ingress from the ALB SG only, on the task port.
  - RDS SG: ingress from the API service SG only, on 5432. **Nothing else — no
    public access, no bastion in this design.**
- App Runner alternative removes the ALB/VPC plumbing entirely (managed
  networking), at the cost of the RDS SG having to allow App Runner's managed
  network interface or putting the DB behind a VPC endpoint — decide when the
  Fargate-vs-App-Runner choice is made.

## 8. Cost notes (hackathon-conscious)

| Item            | Cheap mode                                                                                                       | Notes                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Fargate         | **Fargate Spot** on staging/dev services; 0.5 vCPU / 1 GB ARM64 (`arm64` images build fine with `docker buildx`) | Spot interruption is acceptable for staging; keep prod on base Fargate if budget allows one task. |
| ALB             | ~$7/mo floor                                                                                                     | This is why **App Runner is attractive for a hackathon**: no ALB line item at all.                |
| RDS             | `db.t4g.micro` single-AZ, burstable, 20 GB gp3 — **Free Tier eligible** (750 h/mo for new accounts)              | Graviton (`t4g`) is the cheapest per-performance class here.                                      |
| CloudFront + S3 | Static bundle is a few MB; CloudFront free tier covers demo traffic                                              | Real cost only if the demo goes viral.                                                            |
| NAT gateway     | Avoid (public-IP task on staging)                                                                                | NAT is often the single largest surprise line item.                                               |
| ECR             | Negligible (storage for a few images)                                                                            | Prune old tags monthly.                                                                           |
| Secrets/SSM     | Within free-tier allowances at this count                                                                        | —                                                                                                 |

Target: a fully-running staging stack in the low tens of dollars per month, most
of it ALB — or under ~$10 with App Runner + no NAT.

## 9. Database: migration and seed strategy on RDS

Divergence from local, deliberate and documented:

1. **No boot-time migrations in AWS.** Local's `MIGRATE_ON_BOOT=true` container
   script is a comdev convenience. In AWS, `MIGRATE_ON_BOOT=false`; migrations run
   as an **ECS one-off task** (`aws ecs run-task` with `aws ecs run-task --started-by
migrate-<sha>` style invocation of `node dist/migrate.js`) — or the App Runner
   equivalent: a separate short-lived service/CI step with network access to RDS.
2. **Order of operations for a deploy:**
   a. Run migrations one-off (must be backward-compatible with the currently
   running API revision — expand/contract style; this phase's schema is additive
   by default).
   b. Deploy the new service revision.
   c. Health checks pass → traffic shifts (ALB draining).
3. **Seed:** the idempotent demo seed is run **once on staging** via a one-off task
   (`node dist/seed.js`), and is **never wired into production boot**. Production
   relief content must come from real verified sources — the Delhi seed rows are
   demo data.
4. **Backups:** RDS automated snapshots (1-day retention staging, 7-day prod).
   A manual snapshot is taken before every migration one-off.
5. **Credentials:** master user/password stored only in Secrets Manager; nobody has
   console access to the DB password; no `postgres` superuser use by the app.

## 10. CORS, HTTPS, and the web/API origin split

- Both surfaces are HTTPS: CloudFront (web) with an ACM certificate; ALB (API)
  listener on 443 with its own ACM certificate, or App Runner's managed TLS.
- Because web (`https://heatshift.app`) and API (`https://api.heatshift.app`) are
  different origins, the browser _will_ send cross-origin requests:
  - `CORS_ORIGIN` in the task env is set to the exact web origin (no wildcard in
    prod; wildcard only ever on local dev).
  - The Fastify CORS config must allow the `POST` content types actually used
    (`application/json`) and no credentials (no auth in this phase, so
    `Access-Control-Allow-Credentials` stays off).
  - No custom headers are used today, which keeps every call a **simple request**
    except JSON `POST`s (those need the preflight handled; Fastify CORS plugin
    covers it) — avoid adding custom headers like `X-Request-Id` until preflight is
    deliberately configured.
- **Service worker gotcha:** the PWA manifest, `sw.js` and all assets must be served
  from the same origin as the app root (CloudFront/S3), which they are; do not put
  the SW behind the API origin. CloudFront behaviour for `sw.js` and `manifest.webmanifest`
  must be `Cache-Control: no-cache` (viewer-policy override) so deploys take effect
  without waiting for TTL expiry.
- S3 hosting: index error document = `index.html` for SPA fallback on routes like
  `/dashboard`; CloudFront forwards unknown paths to the same document.

## 11. Rollback strategy

Two independent, boring mechanisms — one per surface:

- **API (ECS):** every deploy leaves the previous task-set revision addressable.
  Rollback = `aws ecs update-service --task-definition <previous-revision>` (the
  image tag is pinned to a git SHA, so this redeploys known-good code). Add an
  ALB target-group health-check threshold tight enough (e.g. 2 failures) that a bad
  deploy is drained automatically before humans notice.
- **Web (S3 + CloudFront):** retain the previous bundle under a versioned prefix
  (e.g. `s3://web-bucket/releases/<git-sha>/`) and flip the CloudFront origin path
  (or re-point the default bucket + invalidate) to roll back. S3 versioning on as a
  belt-and-braces. Because `VITE_API_BASE_URL` is baked in, a rollback is always a
  full-bundle swap, never a partial asset overwrite.
- **Database:** migrations are expand/contract so the previous API revision still
  runs against the post-migration schema; rollback of code does not require rolling
  back the schema. If a migration itself is bad: restore-from-snapshot is the
  documented (heavy) fallback — hence the pre-migration manual snapshot (§9.4).

## 12. Not done yet / out of scope for this phase

Explicitly **not** present today, and not implied by this document being written:

- No AWS account resources exist; no `aws` CLI commands have been run for this project.
- No IaC: `infra/aws/` contains documentation only — no Terraform or CDK code is
  committed (see `infra/aws/README.md` for the intended future file list).
- No ECR repositories, no ECS cluster, no ALB, no App Runner service, no RDS
  instance, no S3 hosting bucket, no CloudFront distribution, no ACM certificates.
- No OIDC trust relationship between GitHub Actions and AWS yet (the deploy role is
  specified in §6 but uncreated).
- No Secrets Manager entries or SSM parameters.
- No staging/production environment variables parity applied anywhere (the table in
  §5 is the design).
- No custom domain, TLS, or DNS records.
- No monitoring/alerting stack beyond the planned alarms in Phase 3.
- No live weather provider — the §7 NAT-egress note is anticipatory only; the heat
  preview endpoint takes client-supplied weather inputs.
- No authentication; anything IAM-related in this plan serves infrastructure
  identity (task roles, CI role), not end-user identity.
- No WAF, no rate limiting beyond ALB defaults, no multi-region.

Deployment work begins with Phase 1 (CI pushes images to ECR) and is gated on this
plan being reviewed and the foundation phase being stable.
