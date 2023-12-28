CREATE TABLE users(
    username VARCHAR(128) NOT NULL PRIMARY KEY UNIQUE,
    password CHAR(57) NOT NULL,  -- SHA-256 hash of the plaintext
    ispro BOOLEAN DEFAULT false,  -- used to determine number of contacts allowed
    num_contacts INTEGER DEFAULT 0,  -- number of contacts user has
    faiss_index_blob BYTEA NOT NULL -- need to insert empty faiss index blob on creation
);


CREATE TABLE contacts(
    creator_name VARCHAR(128) NOT NULL,
    contactid INTEGER NOT NULL,
    fullname VARCHAR(128) NOT NULL,
    location VARCHAR(128),
    userbio VARCHAR(160),
    -- emailaddress VARCHAR(64) UNIQUE NOT NULL CHECK (emailaddress LIKE '%@%.%'),
    phonenumber VARCHAR(32),
    vector_blob BYTEA NOT NULL,
    FOREIGN KEY(creator_name) REFERENCES users(username),
    UNIQUE(creator_name, contactid)
);
-- do search just on userbio for now

