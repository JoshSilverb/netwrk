-- Migration 003: Fix taglabels UUID conversion and finish remaining schema work.
-- State coming in (after 002 partial run):
--   users.user_id      = UUID ✓
--   contacts.user_id   = UUID NOT NULL, FK restored ✓
--   taglabels.user_id  = INTEGER NOT NULL, FK NOT added (wrong table name in 002)
--   users.fullname/email NOT NULL, unique indexes, linked_user_id — not yet done

-- 1. Fix taglabels: drop NOT NULL, convert to UUID, restore NOT NULL + FK.
ALTER TABLE taglabels ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE taglabels ALTER COLUMN user_id SET DATA TYPE UUID USING NULL;
ALTER TABLE taglabels ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE taglabels
  ADD CONSTRAINT taglabels_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- 2. Enforce NOT NULL on fullname/email.
ALTER TABLE users
  ALTER COLUMN fullname SET NOT NULL,
  ALTER COLUMN email    SET NOT NULL;

-- 3. Add UNIQUE indexes (IF NOT EXISTS is safe to rerun).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq    ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users (username);

-- 4. Add linked_user_id to contacts (IF NOT EXISTS is safe to rerun).
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS linked_user_id UUID
    REFERENCES users(user_id) ON DELETE SET NULL;

-- 5. Partial unique index to prevent duplicate linked contacts.
CREATE UNIQUE INDEX IF NOT EXISTS contacts_linked_user_unique
  ON contacts (user_id, linked_user_id)
  WHERE linked_user_id IS NOT NULL;
