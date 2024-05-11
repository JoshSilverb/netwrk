CREATE TABLE users(
    user_id    SERIAL PRIMARY KEY UNIQUE,
    user_token CHAR(33), -- UUID populated upon successful login. Used for identity verification
    username VARCHAR(128) NOT NULL,
    password CHAR(57) NOT NULL,  -- SHA-256 hash of the password plaintext
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
    userbio VARCHAR(500),
    embedding vector(784),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);
-- do search just on userbio for now
