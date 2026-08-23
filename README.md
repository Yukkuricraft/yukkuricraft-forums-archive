# yukkuricraft-forums-archive

A read-only archive of the Yukkuricraft vBulletin forums, served by Nuxt from a
Postgres database converted out of the original MySQL dump.

## Running it

Requires Docker Compose v2.15 or newer.

### 1. Configure

```bash
cp .env.example .env
```

Fill in `POSTGRES_PASSWORD`, `NUXT_SESSION_PASSWORD` (32+ characters) and the
three Discord OAuth values. Keep the Postgres password alphanumeric — it is
interpolated into a connection URL without percent-encoding.

### 2. Supply the dump

Either drop a `.sql` or `.sql.gz` mysqldump into `./.dump/`, or set
`GCS_DUMP_URL` in `.env` and put a service account key at `./.secrets/sa.json`.
A local dump always wins; when one is present the GCS settings are ignored
entirely.

To try the pipeline without production data:

```bash
cp scripts/fixtures/placeholder-dump.sql .dump/
```

### 3. Migrate, once

```bash
docker compose --profile migrate run --rm --build migrate
```

This starts Postgres and a throwaway MySQL 5.7, restores the dump, converts it
with pgloader, and builds the application schema. It takes a few minutes on a
sub-1 GB dump and prints each phase as it goes; the last line is
`Migration complete.`

Running it a second time is safe — it detects the completed migration and exits
without touching anything.

### 4. Drop the legacy database

```bash
docker compose --profile migrate stop mysql-src
docker compose --profile migrate rm -f mysql-src
```

### 5. Start the app

```bash
docker compose up -d
```

The app listens on `127.0.0.1:3000`. It is HTTP and loopback-only by design —
the design expects an existing reverse proxy for TLS. Discord OAuth will not
work over plain HTTP, so the redirect URL must point at the proxy.

Check it came up:

```bash
docker compose ps                                  # both services healthy
curl -s http://127.0.0.1:3000/api/health           # {"status":"ok"}
```

`/api/health` only proves database *connectivity*, not that the application
schema exists — a stack started with `up` before the migration has run will
report healthy while every page fails. Run step 3 first.

## Operations

**Logs**

```bash
docker compose logs -f app
```

**Rebuild after a code change**

```bash
docker compose up -d --build app
```

**Start over from an empty database**

This destroys the `pgdata` volume and everything in it.

```bash
docker compose --profile migrate down -v
```

Then repeat from step 2.

We do not support resuming partial/failed migrations.
You must clear `pgdata` and rerun the migration from a clean slate.

**Keep the raw vBulletin tables**

The migration drops the intermediate `yc_forum_archive` schema once it has been
transformed. Set `KEEP_RAW_SCHEMA=1` to retain it for debugging, at a cost in disk.

## Development

`prisma.config.ts` and `server/utils/db.ts` both read `DB_URL` directly from
the environment — containers get it from `docker-compose.yaml`, but running
outside a container needs it set explicitly. Even `yarn db:generate` requires
it to be present and well-formed (it does not need to be reachable — no
connection is made at generate time), because `prisma.config.ts` reads it
unconditionally:

```bash
yarn install
export DB_URL=postgresql://user:pass@localhost:5432/db
yarn db:generate
yarn dev
```

`yarn lint`, `yarn check-types` and `yarn format` before committing.
