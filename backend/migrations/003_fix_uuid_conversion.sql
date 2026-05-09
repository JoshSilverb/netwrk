-- Migration 003: Complete UUID migration.
-- Starting state (verified from schema inspection):
--   users.user_id      = INTEGER PRIMARY KEY, taglabels_user_id_fkey intact
--   contacts.user_id   = INTEGER nullable, no FK (dropped in 001, NOT NULL dropped in 002)
--   taglabels.user_id  = INTEGER NOT NULL, taglabels_user_id_fkey intact
--   users.fullname/email = nullable, no UNIQUE indexes
--   contacts.linked_user_id = does not exist
--
-- WARNING: Step 1 truncates all user/contact data. This is intentional —
-- this is a hard-cut migration for a pre-launch database with no real data.

BEGIN;

-- 1. Clear all data so USING NULL → SET NOT NULL succeeds on empty tables.
--    CASCADE handles socials and tags (FK'd to contacts/taglabels).
TRUNCATE users, contacts, taglabels, sociallabels RESTART IDENTITY CASCADE;

-- 2. Drop the taglabels FK so we can change users.user_id type.
ALTER TABLE taglabels DROP CONSTRAINT taglabels_user_id_fkey;

-- 3. Drop NOT NULL on taglabels.user_id so USING NULL cast succeeds.
ALTER TABLE taglabels ALTER COLUMN user_id DROP NOT NULL;

-- 4. Convert users.user_id: INTEGER → UUID.
ALTER TABLE users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE users ALTER COLUMN user_id SET DATA TYPE UUID USING gen_random_uuid();
ALTER TABLE users ALTER COLUMN user_id SET DEFAULT gen_random_uuid();

-- 5. Convert contacts.user_id: INTEGER → UUID.
ALTER TABLE contacts ALTER COLUMN user_id SET DATA TYPE UUID USING NULL;

-- 6. Convert taglabels.user_id: INTEGER → UUID.
ALTER TABLE taglabels ALTER COLUMN user_id SET DATA TYPE UUID USING NULL;

-- 7. Restore contacts: NOT NULL + FK.
ALTER TABLE contacts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE contacts
  ADD CONSTRAINT contacts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- 8. Restore taglabels: NOT NULL + FK.
ALTER TABLE taglabels ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE taglabels
  ADD CONSTRAINT taglabels_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- 9. Enforce NOT NULL on fullname and email.
ALTER TABLE users
  ALTER COLUMN fullname SET NOT NULL,
  ALTER COLUMN email    SET NOT NULL;

-- 10. Unique indexes on email and username.
CREATE UNIQUE INDEX users_email_uq    ON users (email);
CREATE UNIQUE INDEX users_username_uq ON users (username);

-- 11. Add linked_user_id to contacts.
ALTER TABLE contacts
  ADD COLUMN linked_user_id UUID
    REFERENCES users(user_id) ON DELETE SET NULL;

-- 12. Prevent duplicate linked contacts per user.
CREATE UNIQUE INDEX contacts_linked_user_unique
  ON contacts (user_id, linked_user_id)
  WHERE linked_user_id IS NOT NULL;

COMMIT;
