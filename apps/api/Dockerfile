# Build context is the repository root (pnpm workspace):
#   docker build -f apps/api/Dockerfile .

FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@11
# Manifests only -> a cached layer for the dependency tree.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# dev: warm dependency layer for docker-compose.dev.yml (source is bind-mounted)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS dev
WORKDIR /app
RUN npm install -g pnpm@11
COPY --from=deps /app ./
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "--filter", "@heatshift/api", "dev"]

FROM node:22-alpine AS deps-prod
WORKDIR /app
RUN npm install -g pnpm@11
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

FROM deps AS build
COPY apps apps
RUN pnpm --filter @heatshift/shared build && pnpm --filter @heatshift/api build

# ---------------------------------------------------------------------------
# runtime: production dependencies + the tsup bundle, in workspace layout so
# pnpm's per-package node_modules symlinks keep resolving.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=deps-prod /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api/dist ./apps/api/dist
# Drizzle SQL migrations are read at boot (MIGRATE_ON_BOOT).
COPY --from=build /app/apps/api/drizzle ./apps/api/drizzle
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" || exit 1

CMD ["node", "dist/server.js"]
