#!/usr/bin/env bash
# Local dev helper for the Netwrk backend.
#
# Usage: ./dev.sh <command> [args...]
#
# Commands:
#   up             docker compose up --build (pass extra args through, e.g. -d)
#   down           docker compose down
#   logs           docker compose logs -f app
#   psql           docker compose exec db psql -U postgres netwrkdb
#   reset-db       wipe local data, rebuild, and re-seed + re-embed
#   embed          run the embedding backfill script only
#   dump-schema    refresh sql/init/01_schema.sql from prod (read-only on prod)
#   pull-prod-data replace local data with a prod snapshot (prompts first)

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# Reads DATABASE_URL out of .env, strips whitespace/quotes, and removes the
# "-pooler" suffix from the host so we get a direct (non-pgbouncer) connection.
# pg_dump needs a direct connection.
get_prod_url() {
  grep '^DATABASE_URL' .env | cut -d= -f2- | tr -d ' "' | sed 's/-pooler//'
}

cmd_up() {
  echo "==> Starting docker compose stack"
  docker compose up --build "$@"
}

cmd_down() {
  echo "==> Stopping docker compose stack"
  docker compose down
}

cmd_logs() {
  echo "==> Tailing app logs"
  docker compose logs -f app
}

cmd_psql() {
  echo "==> Opening psql against local netwrkdb"
  docker compose exec db psql -U postgres netwrkdb "$@"
}

cmd_embed() {
  echo "==> Backfilling missing embeddings"
  docker compose exec app python scripts/dev_embed_missing.py
}

cmd_reset_db() {
  echo "==> Tearing down stack and volumes"
  docker compose down -v
  echo "==> Rebuilding and starting stack"
  docker compose up -d --build
  echo "==> Waiting for db to be ready"
  until docker compose exec db pg_isready -U postgres -d netwrkdb >/dev/null 2>&1; do
    sleep 1
  done
  echo "==> Backfilling missing embeddings"
  docker compose exec app python scripts/dev_embed_missing.py
  echo "==> reset-db complete"
}

cmd_dump_schema() {
  echo "==> Dumping schema from prod (read-only) into sql/init/01_schema.sql"
  local prod_url
  prod_url="$(get_prod_url)"

  local tmp_file
  tmp_file="$(mktemp)"
  trap 'rm -f "$tmp_file"' RETURN

  {
    echo "-- Generated from prod via backend/dev.sh dump-schema. Do not hand-edit; re-run the command after prod migrations."
    docker compose exec -T db pg_dump --schema-only --no-owner --no-privileges --no-comments "$prod_url" \
      | sed -E \
          -e '/^\\(un)?restrict /d' \
          -e '/^ALTER DEFAULT PRIVILEGES/d' \
          -e '/^GRANT /d' \
          -e '/CREATE EXTENSION IF NOT EXISTS (neon|pg_session_jwt)/d' \
          -e '/^(CREATE|ALTER) PUBLICATION/d'
  } > "$tmp_file"

  mv "$tmp_file" sql/init/01_schema.sql
  echo "==> Wrote sql/init/01_schema.sql"
  echo "==> Run ./dev.sh reset-db to apply it locally"
}

cmd_pull_prod_data() {
  echo "This will REPLACE all local data with a snapshot of prod. Local changes will be lost."
  read -r -p "Type 'yes' to continue: " confirm
  if [[ "$confirm" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi

  local prod_url
  prod_url="$(get_prod_url)"

  echo "==> Truncating local public tables"
  docker compose exec -T db psql -v ON_ERROR_STOP=1 -U postgres netwrkdb <<'SQL'
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> 'spatial_ref_sys'
  LOOP
    EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', t);
  END LOOP;
END $$;
SQL

  echo "==> Pulling prod data (read-only pg_dump) and loading it locally"
  docker compose exec -T db pg_dump --data-only --no-owner --disable-triggers --exclude-table=spatial_ref_sys "$prod_url" \
    | docker compose exec -T db psql -v ON_ERROR_STOP=1 -U postgres netwrkdb
  echo "==> pull-prod-data complete"
}

usage() {
  echo "Usage: $0 {up|down|logs|psql|reset-db|embed|dump-schema|pull-prod-data} [args...]" >&2
  exit 1
}

[[ $# -ge 1 ]] || usage
subcommand="$1"
shift

case "$subcommand" in
  up) cmd_up "$@" ;;
  down) cmd_down ;;
  logs) cmd_logs ;;
  psql) cmd_psql "$@" ;;
  reset-db) cmd_reset_db ;;
  embed) cmd_embed ;;
  dump-schema) cmd_dump_schema ;;
  pull-prod-data) cmd_pull_prod_data ;;
  *) usage ;;
esac
