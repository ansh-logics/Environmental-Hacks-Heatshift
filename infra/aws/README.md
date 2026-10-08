# infra/aws — Documentation-Only Folder

**Nothing in this folder is deployable.** There is no Terraform, no CDK, no
CloudFormation, and no `aws` commands to run here. This folder exists so the AWS
target design lives next to the code it describes, and so nobody mistakes it for
working infrastructure.

The deployment plan — mappings, phases, environment parity, IAM, costs, rollback —
is in [`docs/aws-deployment-plan.md`](../../docs/aws-deployment-plan.md).

## What is here

| File              | Contents                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `README.md`       | This notice.                                                                                                                         |
| `architecture.md` | ASCII topology diagram of the target AWS stack plus request-flow walkthroughs (API cold start, rider check-in, coordinator summary). |

## Deployment status

- No AWS resources exist for HeatShift.
- CI (`.github/workflows/ci.yml`) builds the API and web Docker images but deploys
  nothing.
- The seeded Delhi relief dataset referenced by these designs is **demo data**;
  production launch requires verified content before any of this ships real traffic.

## Intended future files (when the IaC phase begins)

Nothing below exists yet; this is the agreed layout so the transition is obvious:

```
infra/aws/
  README.md               (exists — will be updated to describe real stacks)
  architecture.md         (exists — design doc)
  # planned:
  stack-main.ts           # CDK app entry / root stack composition per stage
  stack-network.ts        # VPC, public/private subnets, security groups
  stack-ecs-service.ts    # ECR repos, ECS cluster, Fargate service, ALB
  stack-rds.ts            # RDS PostgreSQL, subnet group, SG rules
  stack-cloudfront.ts     # S3 hosting bucket, CloudFront distribution, ACM ref
  stack-ci-role.ts        # OIDC trust + least-privilege deploy role
  parameters/
    staging.ts            # stage-specific config (instance sizes, counts, origins)
    production.ts
```

Terraform is the alternative if the team prefers HCL; whichever tool is chosen,
`stack-*` files map one-to-one to the modules in
`docs/aws-deployment-plan.md` §2–§7.

## Rule of thumb

If a file in this repo says `apply`, `deploy`, or `up` for AWS — it does not exist
yet. Local execution remains `docker compose up --build`.
