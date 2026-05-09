-- Migration 002: Complete the UUID conversion left incomplete by 001.
-- State coming in:
--   users.user_id      = SERIAL (integer), has fullname/email/is_public columns
--   contacts.user_id   = INTEGER NOT NULL (FK dropped by 001, type unchanged)
--   tag_labels.user_id = INTEGER NOT NULL (FK dropped by 001, type unchanged)
--   contacts.linked_user_id = does not yet exist
-- Assumes no existing rows (hard cut / pre-launch database).

-- 1. Drop NOT NULL on FK columns before casting to UUID.
ALTER TABLE contacts   ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE tag_labels ALTER COLUMN user_id DROP NOT NULL;

-- 2. Convert users.user_id: SERIAL/INTEGER → UUID.
ALTER TABLE users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE users ALTER COLUMN user_id SET DATA TYPE UUID USING gen_random_uuid();
ALTER TABLE users ALTER COLUMN user_id SET DEFAULT gen_random_uuid();

-- 3. Convert FK columns to UUID (no rows so USING NULL is safe).
ALTER TABLE contacts   ALTER COLUMN user_id SET DATA TYPE UUID USING NULL;
ALTER TABLE tag_labels ALTER COLUMN user_id SET DATA TYPE UUID USING NULL;

-- 4. Restore NOT NULL + FK on contacts.
ALTER TABLE contacts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE contacts
  ADD CONSTRAINT contacts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- 5. Restore NOT NULL + FK on tag_labels.
ALTER TABLE tag_labels ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tag_labels
  ADD CONSTRAINT taglabels_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- 6. Enforce NOT NULL on fullname/email (added as nullable in 001).
ALTER TABLE users
  ALTER COLUMN fullname SET NOT NULL,
  ALTER COLUMN email    SET NOT NULL;

-- 7. Add UNIQUE indexes (IF NOT EXISTS avoids double-run errors).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq    ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users (username);

-- 8. Add linked_user_id to contacts.
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS linked_user_id UUID
    REFERENCES users(user_id) ON DELETE SET NULL;

-- 9. Prevent adding the same linked user twice per contact owner.
CREATE UNIQUE INDEX IF NOT EXISTS contacts_linked_user_unique
  ON contacts (user_id, linked_user_id)
  WHERE linked_user_id IS NOT NULL;
