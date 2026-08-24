#!/usr/bin/env bash
# One-time migration of the legacy vBulletin MySQL dump into Postgres.
#
#   1. refuse to run if it already ran
#   2. resolve the dump (local bind mount wins over GCS)
#   3. restore it into the ephemeral MySQL
#   4. prepare MySQL: zero-date fix, drop unused legacy tables
#   5. convert MySQL -> Postgres with pgloader
#   6. build the application schema from create_db.sql
#   7. finalize: drop the raw schema, stamp migration_state, VACUUM ANALYZE
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fixed literals: mysql-src is ephemeral, unpublished, and lives for minutes.
MYSQL_HOST="mysql-src"
MYSQL_USER="root"
MYSQL_PASSWORD="migrate"
MYSQL_DB="yc_forum_archive"

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

PGHOST="db"
PGPORT="5432"
export PGPASSWORD="$POSTGRES_PASSWORD"

# Derived, never operator-set. Exists so envsubst has a single token to
# substitute into the pgloader template.
export PG_TARGET_URL="pgsql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${PGHOST}:${PGPORT}/${POSTGRES_DB}"

DUMP_FILE=""
MIGRATION_SOURCE=""

log() { printf '\n=== %s\n' "$*" >&2; }

psql_q() {
  psql -h "$PGHOST" -p "$PGPORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAq -c "$1"
}

# --skip-ssl is required: MariaDB's client defaults to ssl=TRUE with
# ssl-verify-server-cert=on, which cannot succeed against the self-signed
# certificate mysql-src generates at startup. TLS buys nothing on this link —
# it is container-to-container on an unpublished network, lives for minutes,
# and carries data that is about to be a public archive.
#
# --max-allowed-packet=256M must track the `--max-allowed-packet=256M` the
# mysql-src service is started with in docker-compose.yaml (needed for
# customavatar blobs). Without it the client falls back to its 16 MiB
# default, which becomes the real ceiling regardless of the server setting,
# and restore_mysql()'s `mysql_c < "$DUMP_FILE"` pipes the entire dump
# through this function.
mysql_c() {
  mysql --skip-ssl --max-allowed-packet=256M -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DB" "$@"
}

guard() {
  local exists count
  exists=$(psql_q "SELECT to_regclass('public.migration_state') IS NOT NULL")
  [ "$exists" = "t" ] || return 0

  count=$(psql_q "SELECT count(*) FROM public.migration_state")
  [ "${count:-0}" -gt 0 ] || return 0

  if [ -n "${MIGRATE_FORCE:-}" ]; then
    log "migration_state has ${count} row(s); MIGRATE_FORCE is set, continuing"
    return 0
  fi

  log "Already migrated. Nothing to do."
  psql_q "SELECT completed_at || '  ' || source FROM public.migration_state ORDER BY id" >&2
  log "A completed migration was detected. MIGRATE_FORCE=1 only skips this"
  log "check — it does not clear data, and create_db.sql will fail on"
  log "duplicate objects against an already-populated schema. For a genuine"
  log "reimport, run 'docker compose down -v' to start from an empty database."
  exit 0
}

resolve_source() {
  local local_dump
  local_dump=$(find /source -maxdepth 1 -type f \
                 \( -name '*.sql' -o -name '*.sql.gz' \) 2>/dev/null | sort | head -n 1 || true)

  if [ -n "$local_dump" ]; then
    log "Using local dump: ${local_dump}"
    DUMP_FILE="$local_dump"
    MIGRATION_SOURCE="local:$(basename "$local_dump")"
    return 0
  fi

  if [ -z "${GCS_DUMP_URL:-}" ]; then
    log "ERROR: no .sql or .sql.gz found in /source, and GCS_DUMP_URL is unset."
    log "Either drop a dump into \$DUMP_DIR on the host, or set GCS_DUMP_URL."
    exit 1
  fi

  local key="${GOOGLE_APPLICATION_CREDENTIALS:-/secrets/sa.json}"
  if [ ! -f "$key" ]; then
    log "ERROR: GCS_DUMP_URL is set but there is no service account key at ${key}."
    log "Place it in \$SECRETS_DIR on the host."
    exit 1
  fi

  log "Authenticating to GCS"
  gcloud auth activate-service-account --key-file="$key"

  log "Downloading ${GCS_DUMP_URL}"
  case "$GCS_DUMP_URL" in
    *.gz) DUMP_FILE="/tmp/dump.sql.gz" ;;
    *)    DUMP_FILE="/tmp/dump.sql" ;;
  esac
  gcloud storage cp "$GCS_DUMP_URL" "$DUMP_FILE"
  MIGRATION_SOURCE="$GCS_DUMP_URL"
}

restore_mysql() {
  log "Restoring dump into MySQL"
  if [ "${DUMP_FILE##*.}" = "gz" ]; then
    gzip -dc "$DUMP_FILE" | mysql_c
  else
    mysql_c < "$DUMP_FILE"
  fi
}

prepare_mysql() {
  log "Preparing MySQL: nulling invalid birthday_search values"
  mysql_c < "${SCRIPT_DIR}/mysql_prepare.sql"

  log "Dropping unused legacy tables"
  mysql_c < "${SCRIPT_DIR}/delete_unused_dbs.sql"
}

convert() {
  log "Converting MySQL -> Postgres with pgloader"
  # Restrict substitution to PG_TARGET_URL so nothing else in the recipe is touched.
  envsubst '${PG_TARGET_URL}' < "${SCRIPT_DIR}/convert_mysql_db.load.tmpl" > /tmp/convert.load
  pgloader /tmp/convert.load
}

transform() {
  log "Building the application schema from create_db.sql"
  # --single-transaction makes this all-or-nothing: a failure leaves no app
  # tables behind rather than a half-built schema.
  psql -h "$PGHOST" -p "$PGPORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       --single-transaction -v ON_ERROR_STOP=1 \
       -f "${SCRIPT_DIR}/create_db.sql"
}

finalize() {
  if [ -n "${KEEP_RAW_SCHEMA:-}" ]; then
    log "KEEP_RAW_SCHEMA is set; leaving the raw yc_forum_archive schema in place"
  else
    log "Dropping the raw yc_forum_archive schema"
    psql_q "DROP SCHEMA IF EXISTS yc_forum_archive CASCADE"
  fi

  log "Stamping migration_state"
  psql_q "CREATE TABLE IF NOT EXISTS public.migration_state (
            id           INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            source       TEXT        NOT NULL
          )"
  # Double any single quotes in the source string before interpolating.
  psql_q "INSERT INTO public.migration_state (source) VALUES ('${MIGRATION_SOURCE//\'/\'\'}')"

  log "Running VACUUM ANALYZE"
  psql_q "VACUUM ANALYZE"
}

main() {
  guard
  resolve_source
  restore_mysql
  prepare_mysql
  convert
  transform
  finalize
  log "Migration complete."
}

main "$@"
