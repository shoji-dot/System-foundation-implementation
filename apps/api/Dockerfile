# syntax=docker/dockerfile:1
# apps/api (NestJS) 本番ビルド用 Dockerfile（Railway デプロイ対象）
# Worker サービスも同一イメージを使用し、起動コマンドのみ差し替える
#   API    : node apps/api/dist/main.js
#   Worker : node apps/api/dist/worker/main.js

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

# ---- Prune: turbo でこのサービスに必要なファイルのみ抽出 ----
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@2.3.3
COPY . .
RUN turbo prune @yakuji/api --docker

# ---- Install & Build ----
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN corepack prepare pnpm@9.15.0 --activate \
  && pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @yakuji/api exec prisma generate
RUN pnpm turbo run build --filter=@yakuji/api

# ---- Runtime ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack prepare pnpm@9.15.0 --activate \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs
COPY --from=installer --chown=nestjs:nodejs /app .
USER nestjs

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
