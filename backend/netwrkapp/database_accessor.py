import netwrkapp
from sentence_transformers import SentenceTransformer
 

def get_contacts(userId, query):
    [query_embedding] = netwrkapp.embedder.encode([query])

    cur = netwrkapp.model.get_db()
    cur.execute(
        "SELECT * FROM contacts WHERE owner_id=%s ORDER BY embedding <-> %s", (userId, query_embedding)
    )
    users = cur.fetchall()

    return users