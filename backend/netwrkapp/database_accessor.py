# import netwrkapp
from netwrkapp import model

class Database_Accessor:
    def __init__(self, _embedder):
        self.embedder = _embedder

    def get_contacts(self, userId, query, limit):
        [query_embedding] = self.embedder.encode([query])
        print(query_embedding.shape)

        cur = model.get_db()
        cur.execute("""
            SELECT * FROM contacts 
            WHERE creator_id=%s 
            ORDER BY embedding <-> %s
            LIMIT %s
        """, (userId, query_embedding, limit))
        contacts = cur.fetchall()

        return contacts

    def add_contact(self, userId, fullname, location, emailaddress, phonenumber, userbio):
        contact_info = fullname + "; " + location + "; " + userbio
        [contact_embedding] = self.embedder.encode(contact_info)

        cur = model.get_db()
        cur.execute(
            """
            INSERT INTO contacts
            VALUES ()
            """
        )


