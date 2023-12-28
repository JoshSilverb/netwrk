import flask
import netwrkapp
import faiss
from netwrkapp.config import EMBEDDING_DIM
import psycopg2


@netwrkapp.app.route('/user/new/', methods=['POST'])
def new_user():
    data = flask.request.json
    print(data)
    username = data['username']
    password = data['password']
    print(username, password)

    # Check if the user already exists in database or not? If yes, then return error message
    # Connect to database
    cur = netwrkapp.model.get_db()
    cur.execute(
        "SELECT COUNT(*) FROM users WHERE username=%s", (username,)
    )
    usercount = cur.fetchone()['count']

    print(usercount)

    if usercount > 0:
        return 'User already exists', 409
    
    # If user not in db yet, create fiass index and add user to db
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    print(index.ntotal)
    # Convert the Faiss index to a numpy array
    faiss_index_np = index.reconstruct_n(0, index.ntotal)  # Convert all vectors in the index to a numpy array
    faiss_index_bytes = faiss_index_np.tobytes()  # Convert the numpy array to bytes

    cur.execute(
        "INSERT INTO users (username, password, faiss_index_blob) values (%s, %s, %s)", (username, password, psycopg2.Binary(faiss_index_bytes),)
    )

    return 'success', 200


@netwrkapp.app.route('/contact/new/', methods=['POST'])
def new_contact():
    data = flask.request.json
    print(data)

    creator_name = data['creator_name']
    # contactid 
    fullname = data['fullname']
    location = data['location']
    userbio = data['userbio']
    phonenumber = data['phonenumber']
    # Create an embedding for this person using their bio as input text
    # vector_blob

    # Get 