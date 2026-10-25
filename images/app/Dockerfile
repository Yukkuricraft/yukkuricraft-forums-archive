# syntax=docker/dockerfile:1

FROM node:24.22.1-alpine3.24 AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./

# The postinstall hook is `nuxt prepare`, which needs nuxt.config.ts and the
# source tree. Disabling scripts keeps this layer cacheable independently of
# source; `nuxt build` runs prepare itself in the next stage.
RUN YARN_ENABLE_SCRIPTS=0 yarn install --immutable

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# prisma.config.ts resolves its datasource from env('DB_URL'). Nothing connects
# at build time; the value only has to parse.
ARG DB_URL=postgresql://build:build@localhost:5432/build
ENV DB_URL=$DB_URL

# prisma generate cannot run first. The `typedSql` preview feature makes it
# resolve the project tsconfig, and the root tsconfig.json does
# `"extends": "./.nuxt/tsconfig.json"`, which only `nuxt prepare` writes. With
# YARN_ENABLE_SCRIPTS=0 in the deps stage the postinstall hook never ran, so
# .nuxt does not exist yet and db:generate dies with
# `File './.nuxt/tsconfig.json' not found.`
RUN yarn nuxt prepare

# Order matters: server/utils/db.ts imports ~~/generated/prisma/client.js, which
# does not exist until prisma generate has run. generated/ is gitignored, so it
# is never present in the build context.
RUN yarn db:generate && yarn build

FROM base AS runtime
ENV NODE_ENV=production \
    NITRO_PORT=3000 \
    NITRO_HOST=0.0.0.0

COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
