# syntax=docker/dockerfile:1

# One image for the whole app: the Effect API serves /api and the built web
# app. Built and run by `alchemy deploy` (see alchemy.run.ts).

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN npm install --global pnpm@12.15.0
WORKDIR /repo

# Manifests first, so dependency layers are cached until they change.
FROM base AS manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/

# ─── Build the web app ───────────────────────────────────────────────────────
FROM manifests AS web
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@app/web..."
COPY tsconfig ./tsconfig
COPY vite.config.ts ./
COPY packages/domain ./packages/domain
COPY apps/web ./apps/web
RUN pnpm --filter @app/web run build

# ─── Server production dependencies ──────────────────────────────────────────
FROM manifests AS server-deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter "@app/server..."

# ─── Runtime ─────────────────────────────────────────────────────────────────
# The server runs its TypeScript directly on Node's type stripping, so there is
# no compile step. Workspace packages stay outside node_modules (Node won't
# strip types there), at the same paths pnpm's symlinks point to.
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=server-deps /repo ./
COPY packages/domain/src ./packages/domain/src
COPY apps/server/src ./apps/server/src
COPY --from=web /repo/apps/web/dist ./public

USER node
WORKDIR /app/apps/server
EXPOSE 3000
ENV PORT=3000 STATIC_DIR=/app/public
CMD ["node", "src/main.ts"]
