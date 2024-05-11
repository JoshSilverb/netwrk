import pytest
import numpy as np
from netwrkapp.database_accessor import Database_Accessor
from netwrkapp import model

@pytest.fixture
def mock_embedder():
    class Mockembedder:
        def encode(text):
            return np.arange(0, 784)
    
    return Mockembedder()

@pytest.fixture
def populate_users():
    cur = model.get_db()
    cur.execute("""
        INSERT INTO users (username, password)
        VALUES ('user1', 'password1')
               ('user2', 'password2')
    """)

@pytest.fixture
def populate_contacts(populate_users):
    cur = model.get_db()
    cur.execute("""
        INSERT INTO contacts (creator_id, fullname, location, userbio)
        VALUES ('1', 'Alice A', 'San Francisco', 'the first contact, software engineer, tech worker')
               ('1', 'Bob B', 'New York City', 'A finance guy, Another person, works with money')
               ('2', 'Cindy C', 'London', 'british programmer and likes hiking and the outdoors')
               ('2', 'Bob B', 'New York City', 'A dude who does banking')
    """)

@pytest.fixture
def db_accessor_fake_embedder(mock_embedder):
    return Database_Accessor(mock_embedder)

@pytest.fixture
def clear_database():
    yield
    cur = model.get_db()
    cur.execute("DELETE FROM contacts WHERE 1")
    cur.execute("DELETE FROM users WHERE 1")