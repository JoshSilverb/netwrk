-- Make tag labels unique per user instead of globally.
--
-- Prod had UNIQUE (label) on taglabels, so once any user created a tag named
-- "founder", no other user could create one: the INSERT failed with an
-- IntegrityError. The app already looks labels up per user, so the intended
-- constraint is UNIQUE (user_id, label).
--
-- Also sets label NOT NULL to match the model. This aborts the whole
-- migration if any NULL labels exist; clean those up first if it does.
--
-- Run against prod, then refresh the local snapshot:
--   ./dev.sh dump-schema && ./dev.sh reset-db

BEGIN;

ALTER TABLE public.taglabels DROP CONSTRAINT taglabels_label_key;
ALTER TABLE public.taglabels ALTER COLUMN label SET NOT NULL;
ALTER TABLE public.taglabels
    ADD CONSTRAINT taglabels_user_id_label_key UNIQUE (user_id, label);

COMMIT;
