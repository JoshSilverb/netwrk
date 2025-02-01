CREATE EXTENSION vector;
CREATE EXTENSION postgis;

CREATE TABLE users(
    user_id    SERIAL PRIMARY KEY UNIQUE,
    user_token CHAR(33), -- UUID populated upon successful login. Used for identity verification
    username VARCHAR(128) NOT NULL,
    password TEXT NOT NULL,  -- hash of the password plaintext
    num_contacts INTEGER DEFAULT 0  -- number of contacts user has
);

CREATE TABLE contacts(
    contact_id SERIAL PRIMARY KEY UNIQUE,
    user_id INTEGER NOT NULL,
    fullname VARCHAR(128) NOT NULL,
    location VARCHAR(128),
    coordinates GEOGRAPHY(Point, 4326), -- better way to store coords: https://chatgpt.com/c/679b3589-d888-800f-a885-17aa44789b54
    metthrough VARCHAR(256),
    userbio VARCHAR(500),
    lastcontact DATE DEFAULT CURRENT_DATE,
    importance INTEGER,
    embedding vector(784),
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
-- Index on contacts.coordinates to make location lookup quicker
CREATE INDEX locations_gix ON contacts USING GIST (coordinates);

-- do search just on userbio for now

CREATE TABLE sociallabels(
    id SERIAL PRIMARY KEY UNIQUE,
    label VARCHAR(16)
);

CREATE TABLE socials(
    contact_id INTEGER NOT NULL,
    social_id INTEGER NOT NULL,
    address VARCHAR(64),
    FOREIGN KEY(contact_id) REFERENCES contacts(contact_id),
    FOREIGN KEY(social_id) REFERENCES sociallabels(id)
);

CREATE TABLE taglabels(
    id SERIAL PRIMARY KEY UNIQUE,
    user_id INTEGER NOT NULL,
    label VARCHAR(16),
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE tags(
    contact_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    FOREIGN KEY(contact_id) REFERENCES contacts(contact_id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES taglabels(id) ON DELETE CASCADE
);
