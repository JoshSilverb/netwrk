import flask
import netwrkapp.model
from netwrkapp.config import EMBEDDING_DIM
import psycopg2

placeholder_users = [
    {
        "username": "josh",
        "password": "asdf",        
    }
]

placeholder_contacts = [
  {
    "user_id": 1,
    "fullname": "Alice Allison",
    "location": "San Francisco",
    "emailaddress": "alice@email.com",
    "phonenumber": "123456789",
    "userbio": "Alice is a software engineer in the bay",
  },
  {
    "user_id": 1,
    "fullname": "Bob Bobby",
    "location": "New York",
    "emailaddress": "bob@bobbymail.com",
    "phonenumber": "987654321",
    "userbio": "Bob works in finance and enjoys baseball.",
  },
  {
    "user_id": 1,
    "fullname": "Cam Smith",
    "location": "Chicago",
    "emailaddress": "cam@email.com",
    "phonenumber": "555555555",
    "userbio": "Cam does contracting and plays a lot of baseball which he really likes",
  },
  {
    "user_id": 1,
    "fullname": "Big Dawg",
    "location": "New York",
    "emailaddress": "big@dawg.com",
    "phonenumber": "6666666666",
    "userbio": "Gig concert guitarist",
  },
]

def populate_db():
    cur = netwrkapp.model.get_db()
    for user in placeholder_users:
        cur.execute("""
            INSERT INTO users (username, password) VALUES (%s, %s)
        """, (user["username"], user["password"]))
    
    for contact in placeholder_contacts:
        cur.execute("""
            INSERT INTO contacts (user_id, fullname, location, emailaddress, phonenumber, userbio)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, 
            (user["user_id"], 
             user["fullname"], 
             user["location"], 
             user["emailaddress"], 
             user["phonenumber"], 
             user["userbio"]))

if __name__ == "__main__":
    populate_db()
"""
def add_user(name, pwd):
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    # Convert the Faiss index to a numpy array
    faiss_index_np = index.reconstruct_n(0, len(index))  # Convert all vectors in the index to a numpy array
    faiss_index_bytes = faiss_index_np.tobytes()  # Convert the numpy array to bytes

    netwrkapp.model.get_db().execute(
                "INSERT INTO users (username, password, faiss_index_blob) values (%s, %s, %s)", (name, pwd, psycopg2.Binary(faiss_index_bytes),)
            )


def add_users(count):
    users_in_db = netwrkapp.model.get_db().execute(
                "SELECT COUNT(*) FROM users"
            ).fetchall()[0]["COUNT(*)"]
    if users_in_db > 0:
        return
    
    for i in range(count):
        add_user(i, "pwd" + str(i))


if __name__ == "__main__":
    add_user("joshsilv", "ayylmao")
"""