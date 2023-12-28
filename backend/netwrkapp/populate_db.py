import flask
import netwrkapp.model
from netwrkapp.config import EMBEDDING_DIM
import faiss
import psycopg2


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
    