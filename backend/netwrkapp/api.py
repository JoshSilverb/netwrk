import flask
import netwrkapp
import uuid
# from netwrkapp import d_database_accessor


@netwrkapp.app.route('/login/', methods=['POST'])
def log_user_in():
    username = flask.request.json["username"]
    password = flask.request.json["password"]

    cur = netwrkapp.model.get_db()
    cur.execute(
        "SELECT COUNT(*) FROM users WHERE username=%s AND password=%s", 
        (username, password)
    )
    usercount = cur.fetchone()['count']

    if 0 != usercount:
        # Set a random user_token in the site cookies and store it in the DB
        # so it can be used to validate users in later calls
        user_token = uuid.uuid1().hex
        print(type(user_token))
        print("#################################\n",user_token)
        cur.execute(
            "UPDATE users SET user_token=%s WHERE username=%s",
            (user_token, username)
        )

        # Frontend needs to use this url to redirect to dashboard after login
        res = flask.make_response(flask.jsonify({'redirect_url': '/dashboard/'}), 200)
        res.set_cookie("userToken", value=user_token)
        res.set_cookie("username", value=username)
    
        return res

    else:
        # clear userId cookie to show unsuccessful login to other routes
        res = flask.make_response({}, 401)
        res.set_cookie("userToken", value='')

        return res


@netwrkapp.app.route('/contacts/', methods=['POST'])
def get_contacts():
    # if "userId" not in flask.request.cookies or not flask.request.cookies["userId"]:
    #     return flask.jsonify({'redirect_url': '/login/'}), 401
    
    # user_token = flask.request.cookies.get('user_token')
    print("Got a contacts rq")
    username = flask.request.json['username']
    print("Username is:", username)
    cur = netwrkapp.model.get_db()
    cur.execute("""
        SELECT fullname, location, emailaddress, phonenumber, userbio 
        FROM contacts 
        INNER JOIN users ON users.user_id=contacts.user_id 
        WHERE users.username=%s;
    """, (username,))
    contacts = cur.fetchall()
    print(len(contacts))

    return flask.jsonify({'contacts': contacts}), 200


@netwrkapp.app.route('/contacts/new/', methods=['POST'])
def new_contact():
    data = flask.request.json
    print(data)

    creator_name = data['creatorname']
    cur = netwrkapp.model.get_db()
    cur.execute("""
        SELECT user_id FROM users WHERE username=%s;
    """, (creator_name,))
    user_id = cur.fetchall()[0]['user_id']
    fullname = data['fullname']
    location = data['location']
    emailaddress = data['emailaddress']
    phonenumber = data['phonenumber']
    userbio = data['userbio']

    cur.execute("""
        INSERT INTO contacts (user_id, fullname, location, emailaddress, phonenumber, userbio)
        VALUES (%s, %s, %s, %s, %s, %s);
    """, (user_id, fullname, location, emailaddress, phonenumber, userbio))


    return flask.jsonify({}), 200

"""
@netwrkapp.app.route('/contacts/search', methods=['POST'])
def get_contacts():
    if "userId" not in flask.request.cookies or not flask.request.cookies["userId"]:
        return 401, flask.jsonify({'redirect_url': '/dashboard/'})
    
    userId = flask.request.cookies.get('userId')
    query = flask.request.json["query"]
    contacts = netwrkapp.d_database_accessor.get_contacts(userId, query, 10)

    resp = {'contacts': contacts}

    return flask.jsonify(resp), 200


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

"""