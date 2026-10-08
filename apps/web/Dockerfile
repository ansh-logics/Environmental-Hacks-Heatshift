# Build context is the repository root:
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_BASE_URL=http://localhost:3000 .

FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@11
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY packages packages
COPY apps apps

# Baked into the bundle at build time (Vite has no runtime env).
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# Public Mapbox token. Empty is a supported build: the relief page then renders
# its "map unavailable" fallback instead. Never log or echo this value.
ARG VITE_MAPBOX_ACCESS_TOKEN=
ENV VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN
RUN pnpm --filter @heatshift/shared build && pnpm --filter @heatshift/web build

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]

# ---------------------------------------------------------------------------
# dev: warm dependency layer for docker-compose.dev.yml (source is bind-mounted)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS dev
WORKDIR /app
RUN npm install -g pnpm@11
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json /app/tsconfig.base.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/eslint-config/package.json ./packages/eslint-config/package.json
ENV NODE_ENV=development
EXPOSE 5173
CMD ["pnpm", "--filter", "@heatshift/web", "dev", "--host", "0.0.0.0"]
