-- Migration 004: Add coordinates column to users for map support.
-- Linked contacts inherit their map position from the linked user's coordinates.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS coordinates GEOGRAPHY(POINT,4326);
CREATE INDEX IF NOT EXISTS users_coordinates_gix ON users USING GIST (coordinates);

COMMIT;
