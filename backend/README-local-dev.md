# Local development

Run the Flask backend and a local Postgres (PostGIS + pgvector) in Docker. No connection
to Neon is needed at runtime — the local database is seeded with fake data.

## Prerequisites

- Docker Desktop, running.
- `backend/.env` filled in from `backend/.env.example`. You need real `OPENAI_API_KEY`,
  `GOOGLE_API_KEY`, and `S3_BUCKET_NAME`/AWS credentials — local dev uses the real OpenAI,
  Google, and S3 services (local uploads go under a `dev/` key prefix, so they don't
  collide with prod objects). `DATABASE_URL` in `.env` should stay the Neon prod URL —
  it's only used for `dump-schema`/`pull-prod-data`; `docker-compose.yaml` overrides it
  for the app container to point at the local `db` service.

## First run

```bash
cd backend
./dev.sh up
```

This builds and starts two containers:
- `db` — Postgres with PostGIS and pgvector, exposed on host port **5433**. On first
  boot it runs `sql/init/01_schema.sql` (a snapshot of the prod schema) and
  `sql/init/02_seed.sql` (fake seed data: users `dev`/`devpassword` and
  `demo`/`devpassword`, and ~12 contacts).
- `app` — Flask, listening on `http://localhost:8000`.

Seed contacts load with `embedding` left `NULL`. Backfill them once (in another
terminal, once `up` reports the stack is healthy):

```bash
./dev.sh embed
```

Log in from the frontend (or `curl`) with `dev` / `devpassword`.

## Other commands

```bash
./dev.sh down             # stop the stack
./dev.sh logs              # tail the app container's logs
./dev.sh psql              # open psql against the local netwrkdb
./dev.sh reset-db          # wipe local data/volumes, rebuild, re-seed, and re-embed
./dev.sh dump-schema       # refresh sql/init/01_schema.sql from prod (read-only pg_dump)
./dev.sh pull-prod-data    # opt-in: replace local data with a real prod snapshot (prompts first)
```

Run `./dev.sh dump-schema` after any manual prod schema migration, then `./dev.sh reset-db`
to apply the refreshed schema locally.

## Frontend

Dev builds (`yarn start`, `yarn ios`, `yarn android`) hit the local backend by default.
To point at prod instead, use `yarn start:prod` (or `EXPO_PUBLIC_API_TARGET=prod`).
See `frontend/.env.example` for the underlying env vars, and `frontend/constants/Apis.ts`
for how the target is resolved.

## Troubleshooting

**A physical device can't reach the backend.** The phone and the Mac need to be on the
same Wi-Fi network, and the macOS firewall must allow incoming connections on port 8000
(System Settings → Network → Firewall). `expo start --tunnel` won't work for local dev —
its public hostname can't reach `:8000`; use LAN mode, or set `EXPO_PUBLIC_API_URL`
explicitly (e.g. to an ngrok URL) if you need tunnel mode.

**Port 5433 or 8000 is already in use.** Something else (often another `docker compose`
stack, or a lingering process) is bound to the port. Find and stop it, e.g.
`lsof -i :5433` / `lsof -i :8000`, or stop other compose stacks with `docker compose down`.

**Changed an `EXPO_PUBLIC_*` variable and nothing changed.** These are baked in at Metro
bundling time. Restart Metro with a cleared cache: `expo start -c` (or `yarn start:prod`,
which already does this).

**`pull-prod-data` failed partway through.** It truncates local tables before loading the
prod snapshot, so a failed restore can leave the local database empty. Run
`./dev.sh reset-db` to get back to a clean, seeded state.

**Web login doesn't work.** `utils/tokenstore.tsx` uses `expo-secure-store`, which has no
web implementation. Pre-existing issue, not specific to local dev.

**`expo export --platform web` fails.** `react-native-maps`, used in `app/(tabs)/map.tsx`,
doesn't support static web export. Pre-existing issue.
