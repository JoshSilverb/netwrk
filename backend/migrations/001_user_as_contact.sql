-- Migration 001: Add user-as-contact support
-- Hard cut: assumes no existing user rows (safe for dev/pre-launch)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add new columns to users before changing PK type
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fullname  VARCHAR(128),
  ADD COLUMN IF NOT EXISTS email     VARCHAR(256),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- Drop FK constraints that reference users.user_id before changing its type
ALTER TABLE contacts   DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;
ALTER TABLE tag_labels DROP CONSTRAINT IF EXISTS tag_labels_user_id_fkey;

-- Change user_id from SERIAL/INTEGER to UUID
ALTER TABLE users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE users ALTER COLUMN user_id SET DATA TYPE UUID USING gen_random_uuid();
ALTER TABLE users ALTER COLUMN user_id SET DEFAULT gen_random_uuid();

-- Change the FK columns in dependent tables to UUID (rows are empty so USING NULL is safe)
ALTER TABLE contacts   ALTER COLUMN user_id SET DATA TYPE UUID USING NULL;
ALTER TABLE tag_labels ALTER COLUMN user_id SET DATA TYPE UUID USING NULL;

-- Restore FK constraints
ALTER TABLE contacts
  ADD CONSTRAINT contacts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE tag_labels
  ADD CONSTRAINT tag_labels_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Enforce NOT NULL and UNIQUE on new columns now that type change is done
ALTER TABLE users
  ALTER COLUMN fullname SET NOT NULL,
  ALTER COLUMN email    SET NOT NULL;

ALTER TABLE users
  ADD CONSTRAINT users_email_unique    UNIQUE (email),
  ADD CONSTRAINT users_username_unique UNIQUE (username);

-- Add linked_user_id to contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS linked_user_id UUID
    REFERENCES users(user_id) ON DELETE SET NULL;

-- Prevent adding the same linked user twice per contact owner
CREATE UNIQUE INDEX IF NOT EXISTS contacts_linked_user_unique
  ON contacts (user_id, linked_user_id)
  WHERE linked_user_id IS NOT NULL;
