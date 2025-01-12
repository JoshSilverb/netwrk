CREATE TABLE users(
    user_id    SERIAL PRIMARY KEY UNIQUE,
    user_token CHAR(33), -- UUID populated upon successful login. Used for identity verification
    username VARCHAR(128) NOT NULL,
    password TEXT NOT NULL,  -- hash of the password plaintext
    num_contacts INTEGER DEFAULT 0  -- number of contacts user has
);

CREATE EXTENSION vector;

CREATE TABLE contacts(
    contact_id SERIAL PRIMARY KEY UNIQUE,
    user_id INTEGER NOT NULL,
    fullname VARCHAR(128) NOT NULL,
    location VARCHAR(128),
    emailaddress VARCHAR(64) CHECK (emailaddress LIKE '%@%.%'),
    phonenumber VARCHAR(32),
    linkedin VARCHAR(64),
    instagram VARCHAR(64),
    metthrough VARCHAR(256),
    userbio VARCHAR(500),
    lastcontact DATE,
    importance INTEGER,
    embedding vector(784),
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
-- do search just on userbio for now

-- FUTURE WORK:
-- CREATE TABLE socialmedia(
--     contact_id INTEGER NOT NULL,
--     label VARCHAR(32),
--     address VARCHAR(64),
--     FOREIGN KEY(contact_id) REFERENCES contacts(contact_id)
-- )

-- CREATE TABLE tags(
--     contact_id INTEGER NOT NULL,
--     tag VARCHAR(32),
--     FOREIGN KEY(contact_id) REFERENCES contacts(contact_id) ON DELETE CASCADE
-- )