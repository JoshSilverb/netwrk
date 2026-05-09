-- Migration 003: UUID migration preserving existing data.
--
-- Strategy: add UUID shadow columns, propagate via old integer IDs, then
-- swap out the old integer columns for the UUID ones.
--
-- Notes on existing data:
--   - fullname: backfilled from username for rows where it is NULL.
--   - email: NOT enforced NOT NULL — existing users have none. New
--     registrations are validated at the API layer. The unique index
--     uses standard behavior (NULLs are always distinct in Postgres,
--     so multiple NULL emails are allowed).

BEGIN;

-- ── Phase 1: Add UUID shadow columns ─────────────────────────────────────────

-- users: DEFAULT gen_random_uuid() auto-populates every existing row.
ALTER TABLE users     ADD COLUMN user_uuid UUID NOT NULL DEFAULT gen_random_uuid();
-- contacts / taglabels: populated via JOIN in Phase 2.
ALTER TABLE contacts  ADD COLUMN user_uuid UUID;
ALTER TABLE taglabels ADD COLUMN user_uuid UUID;

-- ── Phase 2: Propagate UUIDs to FK tables via old integer IDs ────────────────

UPDATE contacts  c SET user_uuid = u.user_uuid FROM users u WHERE c.user_id = u.user_id;
UPDATE taglabels t SET user_uuid = u.user_uuid FROM users u WHERE t.user_id = u.user_id;

-- ── Phase 3: Drop FK constraints that block column drops ─────────────────────
-- (contacts_user_id_fkey was already dropped in migration 001)

ALTER TABLE taglabels DROP CONSTRAINT taglabels_user_id_fkey;

-- ── Phase 4: Drop old integer user_id columns ─────────────────────────────────
-- CASCADE on users drops the users_pkey index automatically.

ALTER TABLE users     DROP COLUMN user_id CASCADE;
ALTER TABLE contacts  DROP COLUMN user_id;
ALTER TABLE taglabels DROP COLUMN user_id;

-- ── Phase 5: Rename shadow columns ───────────────────────────────────────────

ALTER TABLE users     RENAME COLUMN user_uuid TO user_id;
ALTER TABLE contacts  RENAME COLUMN user_uuid TO user_id;
ALTER TABLE taglabels RENAME COLUMN user_uuid TO user_id;

-- ── Phase 6: Restore primary key on users ────────────────────────────────────

ALTER TABLE users ADD PRIMARY KEY (user_id);

-- ── Phase 7: Restore NOT NULL + FKs ──────────────────────────────────────────
-- If any contacts/taglabels rows had an orphaned user_id (no matching user),
-- their user_uuid will be NULL and SET NOT NULL will fail. That means orphaned
-- rows exist — delete them first if that happens.

ALTER TABLE contacts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE contacts
  ADD CONSTRAINT contacts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE taglabels ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE taglabels
  ADD CONSTRAINT taglabels_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- ── Phase 8: Backfill fullname; enforce NOT NULL on fullname only ─────────────

UPDATE users SET fullname = username WHERE fullname IS NULL;
ALTER TABLE users ALTER COLUMN fullname SET NOT NULL;

-- email: left nullable — existing users have no email. Enforced at API layer.

-- ── Phase 9: Unique indexes ───────────────────────────────────────────────────

CREATE UNIQUE INDEX users_email_uq    ON users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX users_username_uq ON users (username);

-- ── Phase 10: Add linked_user_id to contacts ─────────────────────────────────

ALTER TABLE contacts
  ADD COLUMN linked_user_id UUID
    REFERENCES users(user_id) ON DELETE SET NULL;

CREATE UNIQUE INDEX contacts_linked_user_unique
  ON contacts (user_id, linked_user_id)
  WHERE linked_user_id IS NOT NULL;

COMMIT;
