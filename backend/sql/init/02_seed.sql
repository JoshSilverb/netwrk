-- Fake local dev seed data. Loaded automatically after 01_schema.sql by the
-- postgres image's docker-entrypoint-initdb.d mechanism. Never run against Neon.
--
-- Users:    dev (password 'devpassword') and demo (public, same password).
-- Contacts: ~12 contacts owned by dev, varied cities/met_through/bio/tags/reminders,
--           with one linked to the demo user. All embeddings are left NULL —
--           run scripts/dev_embed_missing.py afterwards to fill them in.

BEGIN;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

INSERT INTO public.users (
    user_id, username, password, fullname, email, is_public,
    location, coordinates, bio, num_contacts, user_token
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'dev',
    '$2b$12$NKX3kM4glgkLSzV99phsYO7vdq3y7WEQJf3NBefhNC9jRw6ymXIAO', -- devpassword
    'Dev User',
    'dev@example.com',
    false,
    'San Francisco, CA, USA',
    ST_GeogFromText('SRID=4326;POINT(-122.4194 37.7749)'),
    'Local development account for Netwrk.',
    12,
    NULL
),
(
    '00000000-0000-0000-0000-000000000002',
    'demo',
    '$2b$12$jc4wy9v07zMnmG2AR5XefOiWLcQ02uVYm1XpJk/.lQwyeQmj/41pG', -- devpassword
    'Liam O''Brien',
    'demo@example.com',
    true,
    'New York, NY, USA',
    ST_GeogFromText('SRID=4326;POINT(-74.0060 40.7128)'),
    'Public demo account, used as a search/link target for the dev account.',
    0,
    NULL
);

-- ---------------------------------------------------------------------------
-- Tag labels (dev's tags — taglabels.label is globally unique)
-- ---------------------------------------------------------------------------

INSERT INTO public.taglabels (id, label, user_id) VALUES
(1, 'founder',  '00000000-0000-0000-0000-000000000001'),
(2, 'investor', '00000000-0000-0000-0000-000000000001'),
(3, 'friend',   '00000000-0000-0000-0000-000000000001'),
(4, 'college',  '00000000-0000-0000-0000-000000000001'),
(5, 'hiking',   '00000000-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------------
-- Social labels (free-form, created on demand by add_contact in prod)
-- ---------------------------------------------------------------------------

INSERT INTO public.sociallabels (id, label) VALUES
(1, 'phone'),
(2, 'email'),
(3, 'instagram');

-- ---------------------------------------------------------------------------
-- Contacts (all owned by dev; contact 12 is linked to the demo user)
--
-- nextcontact mirrors the formula in add_contact() in app/db/accessor.py:
--   lastcontact + remind_in_weeks*7 days + remind_in_months months
-- computed here directly so it's guaranteed consistent with the inputs.
--
-- Every date is expressed relative to CURRENT_DATE (not a hardcoded literal),
-- so the intended mix of past-due / due-today / future / no-reminder contacts
-- holds no matter when this seed is loaded (e.g. via `./dev.sh reset-db`
-- months from now), not just on the day this file was written.
-- ---------------------------------------------------------------------------

INSERT INTO public.contacts (
    contact_id, fullname, location, coordinates, metthrough, userbio,
    lastcontact, remind_in_weeks, remind_in_months, nextcontact,
    embedding, profile_pic_object_name, user_id, linked_user_id
) VALUES
(
    1, 'Sarah Chen', 'San Francisco, CA, USA',
    ST_GeogFromText('SRID=4326;POINT(-122.4194 37.7749)'),
    'Y Combinator batch', 'Founder of a climate tech startup, looking for seed investors.',
    (CURRENT_DATE - 57), 4, 0,
    ((CURRENT_DATE - 57) + INTERVAL '28 days')::date, -- past due
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    2, 'Marcus Webb', 'New York, NY, USA',
    ST_GeogFromText('SRID=4326;POINT(-74.0060 40.7128)'),
    'college roommate', 'Old friend from college, now works in finance.',
    (CURRENT_DATE - 7), 0, 1,
    ((CURRENT_DATE - 7) + INTERVAL '1 months')::date, -- future
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    3, 'Priya Patel', 'Austin, TX, USA',
    ST_GeogFromText('SRID=4326;POINT(-97.7431 30.2672)'),
    'hiking trip in Yosemite', 'Met on a hiking trip, loves the outdoors and works as a product manager.',
    (CURRENT_DATE - 14), 2, 0,
    ((CURRENT_DATE - 14) + INTERVAL '14 days')::date, -- due today
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    4, 'David Kim', 'Seattle, WA, USA',
    ST_GeogFromText('SRID=4326;POINT(-122.3321 47.6062)'),
    'startup conference', 'Angel investor interested in seed-stage climate tech.',
    (CURRENT_DATE - 74), 0, 2,
    ((CURRENT_DATE - 74) + INTERVAL '2 months')::date, -- past due
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    5, 'Elena Rodriguez', 'Chicago, IL, USA',
    ST_GeogFromText('SRID=4326;POINT(-87.6298 41.8781)'),
    'mutual friend introduction', 'Works in venture capital, occasionally invests in early-stage startups.',
    (CURRENT_DATE - 118), 0, 3,
    ((CURRENT_DATE - 118) + INTERVAL '3 months')::date, -- past due
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    6, 'James Nguyen', 'Boston, MA, USA',
    ST_GeogFromText('SRID=4326;POINT(-71.0589 42.3601)'),
    'grad school', 'PhD researcher in machine learning, friend since grad school.',
    (CURRENT_DATE - 17), 6, 0,
    ((CURRENT_DATE - 17) + INTERVAL '42 days')::date, -- future
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    7, 'Olivia Martinez', 'Denver, CO, USA',
    ST_GeogFromText('SRID=4326;POINT(-104.9903 39.7392)'),
    'rock climbing gym', 'Rock climbing partner, also an avid hiker.',
    (CURRENT_DATE - 38), 0, 1,
    ((CURRENT_DATE - 38) + INTERVAL '1 months')::date, -- past due
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    8, 'Ryan Thompson', 'Miami, FL, USA',
    ST_GeogFromText('SRID=4326;POINT(-80.1918 25.7617)'),
    'startup demo day', 'Founder of a fintech startup raising a Series A.',
    (CURRENT_DATE - 2), 2, 0,
    ((CURRENT_DATE - 2) + INTERVAL '14 days')::date, -- future
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    9, 'Sophia Lee', 'Los Angeles, CA, USA',
    ST_GeogFromText('SRID=4326;POINT(-118.2437 34.0522)'),
    'wedding of a mutual friend', 'Works in the entertainment industry, met at a friend''s wedding.',
    (CURRENT_DATE - 149), 0, 0,
    NULL, -- no reminder period set, matching add_contact's None-on-zero rule
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    10, 'Ahmed Hassan', 'Portland, OR, USA',
    ST_GeogFromText('SRID=4326;POINT(-122.6765 45.5152)'),
    'hiking trip', 'Met while hiking Mt. Hood, works as a civil engineer.',
    (CURRENT_DATE - 26), 3, 0,
    ((CURRENT_DATE - 26) + INTERVAL '21 days')::date, -- past due
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    11, 'Grace Park', 'San Diego, CA, USA',
    ST_GeogFromText('SRID=4326;POINT(-117.1611 32.7157)'),
    'startup accelerator', 'Co-founder of a health tech startup, actively fundraising from investors.',
    (CURRENT_DATE - 22), 0, 1,
    ((CURRENT_DATE - 22) + INTERVAL '1 months')::date, -- future
    NULL, NULL, '00000000-0000-0000-0000-000000000001', NULL
),
(
    -- Linked contact: location/bio come from the linked user at read time
    -- (see app/routes/contacts.py), so they're left NULL here on purpose.
    12, 'Liam O''Brien', NULL, NULL,
    'networking event', NULL,
    (CURRENT_DATE - 17), 0, 0,
    NULL,
    NULL, NULL, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'
);

-- ---------------------------------------------------------------------------
-- Tags (contact <-> taglabel)
-- ---------------------------------------------------------------------------

INSERT INTO public.tags (contact_id, tag_id) VALUES
(1, 1), (1, 2),   -- Sarah Chen: founder, investor
(2, 4), (2, 3),   -- Marcus Webb: college, friend
(3, 5), (3, 3),   -- Priya Patel: hiking, friend
(4, 2),           -- David Kim: investor
(5, 2),           -- Elena Rodriguez: investor
(6, 4),           -- James Nguyen: college
(7, 5), (7, 3),   -- Olivia Martinez: hiking, friend
(8, 1),           -- Ryan Thompson: founder
(9, 3),           -- Sophia Lee: friend
(10, 5),          -- Ahmed Hassan: hiking
(11, 1), (11, 2), -- Grace Park: founder, investor
(12, 3);          -- Liam O'Brien: friend

-- ---------------------------------------------------------------------------
-- Socials (a couple of examples)
-- ---------------------------------------------------------------------------

INSERT INTO public.socials (contact_id, social_id, address) VALUES
(1, 1, '+1-415-555-0142'),          -- Sarah Chen: phone
(1, 2, 'sarah.chen@example.com'),   -- Sarah Chen: email
(3, 3, '@priya.explores');          -- Priya Patel: instagram

-- ---------------------------------------------------------------------------
-- Reset sequences to continue after the explicit IDs inserted above
-- ---------------------------------------------------------------------------

SELECT setval('public.contacts_contact_id_seq', (SELECT MAX(contact_id) FROM public.contacts));
SELECT setval('public.taglabels_id_seq', (SELECT MAX(id) FROM public.taglabels));
SELECT setval('public.sociallabels_id_seq', (SELECT MAX(id) FROM public.sociallabels));

COMMIT;
