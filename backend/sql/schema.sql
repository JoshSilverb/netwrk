CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users(
    user_id    SERIAL PRIMARY KEY UNIQUE,
    user_token CHAR(32), -- UUID populated upon successful login. Used for identity verification
    username VARCHAR(128) NOT NULL,
    password TEXT NOT NULL,  -- hash of the password plaintext
    num_contacts INTEGER DEFAULT 0,  -- number of contacts user has
    bio TEXT,
    profile_pic_object_name VARCHAR(128),
    location VARCHAR(128)
);
-- TEST PASSWORD: "Pwd"

CREATE TABLE contacts(
    contact_id SERIAL PRIMARY KEY UNIQUE,
    user_id INTEGER NOT NULL,
    fullname VARCHAR(128) NOT NULL,
    location VARCHAR(128),
    coordinates GEOGRAPHY(Point, 4326), -- better way to store coords: https://chatgpt.com/c/679b3589-d888-800f-a885-17aa44789b54
    metthrough VARCHAR(256),
    userbio VARCHAR(500),
    lastcontact DATE DEFAULT CURRENT_DATE,
    remind_in_weeks INTEGER DEFAULT 0,
    remind_in_months INTEGER DEFAULT 0,
    nextcontact DATE,
    embedding vector(1536), -- Default number of dimensions, can also reduce this: https://platform.openai.com/docs/guides/embeddings#embedding-models:~:text=To%20reduce%20the%20embedding%27s%20dimensions%20without%20losing%20its%20concept%2Drepresenting%20properties%2C%20pass%20in%20the%20dimensions%20parameter.
    profile_pic_object_name VARCHAR(128),
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
-- Index on contacts.coordinates to make location lookup quicker
CREATE INDEX locations_gix ON contacts USING GIST (coordinates);
-- Index on contacts.embedding for fast similarity search
CREATE INDEX IF NOT EXISTS contacts_embedding_idx ON contacts USING hnsw (embedding vector_cosine_ops);

-- do search just on userbio for now

CREATE TABLE sociallabels(
    id SERIAL PRIMARY KEY UNIQUE,
    label VARCHAR(16) UNIQUE
);

CREATE TABLE socials(
    contact_id INTEGER NOT NULL,
    social_id INTEGER NOT NULL,
    address VARCHAR(64),
    FOREIGN KEY(contact_id) REFERENCES contacts(contact_id) ON DELETE CASCADE,
    FOREIGN KEY(social_id) REFERENCES sociallabels(id) ON DELETE CASCADE
);

CREATE TABLE taglabels(
    id SERIAL PRIMARY KEY UNIQUE,
    user_id INTEGER NOT NULL,
    label VARCHAR(16) UNIQUE,
    UNIQUE(user_id, label),
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE tags(
    contact_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    UNIQUE(contact_id, tag_id),
    FOREIGN KEY(contact_id) REFERENCES contacts(contact_id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES taglabels(id) ON DELETE CASCADE
);
