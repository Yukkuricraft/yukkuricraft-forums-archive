# Based on
# https://turborepo.com/docs/guides/tools/docker
# https://hono.dev/docs/getting-started/nodejs
FROM node:22-alpine AS base

FROM base AS builder

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN yarn global add turbo@^2
COPY .. .

RUN turbo prune @yukkuricraft-forums-archive/backend --docker

FROM base AS installer

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN corepack enable

COPY --from=builder /app/out/json/ .
RUN yarn install --immutable

COPY --from=builder /app/out/full/ .
RUN yarn turbo run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=installer --chown=hono:nodejs /app/backend/node_modules /app/node_modules
COPY --from=installer --chown=hono:nodejs /app/backend/dist /app/dist
COPY --from=installer --chown=hono:nodejs /app/backend/package.json /app/package.json

USER hono
EXPOSE 3000

RUN yarn global add extensionless

ENV NODE_ENV=production

# --import=extensionless/register is because bbob is stupid
CMD ["node", "--import=extensionless/register", "/app/dist/index.js"]