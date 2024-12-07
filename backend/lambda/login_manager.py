"""db_accessor.py"""

import bcrypt
import uuid
import psycopg2
import psycopg2.extras

from db_accessor import Db_config


def store_user_credentials(username, password, db_config: Db_config):
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=db_config.db_host,
        database=db_config.db_name,
        user=db_config.db_user,
        password=db_config.db_pwd,
        port=db_config.db_port
    )

    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # Make sure nobody else has this username
    cursor.execute("SELECT COUNT(*) FROM users WHERE username=%s", (username,))
    usernameCount = cursor.fetchone()[0]

    print(f"Found {usernameCount} other users with the username={username}")

    if usernameCount != 0:
        raise NameError("Username already taken")

    # Add new user to DB if not
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user_token = uuid.uuid4().hex

    cursor.execute(
        "INSERT INTO users (username, user_token, password) \
            VALUES (%s, %s, %s)",
        (username, user_token, hashed_password.decode('utf-8')))
    conn.commit()

    print(f"Successfully created user profile for username={username}")

    return user_token


def validate_user_credentials(username, password, db_config: Db_config):
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=db_config.db_host,
        database=db_config.db_name,
        user=db_config.db_user,
        password=db_config.db_pwd,
        port=db_config.db_port
    )

    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # See if this username and password are valid
    cursor.execute("SELECT password FROM users WHERE username=%s", (username,))
    result = cursor.fetchone()
    if not result:
        print(f"Found no user profile matching username={username}")
        raise NameError("Invalid credentials")

    stored_password_hash = result[0]

    if not bcrypt.checkpw(password.encode('utf-8'), stored_password_hash.encode('utf-8')):
        print(f"Password is wrong for username={username}")
        raise NameError("Invalid credentials")

    # Add new user token to DB and return to user if login succeeds
    user_token = uuid.uuid4().hex

    cursor.execute(
        "UPDATE users SET user_token=%s WHERE username=%s",
        (user_token, username))
    conn.commit()

    print(f"Successfully validated user credentials for username={username}")

    return user_token


def delete_user(username, password, db_config: Db_config):
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=db_config.db_host,
        database=db_config.db_name,
        user=db_config.db_user,
        password=db_config.db_pwd,
        port=db_config.db_port
    )

    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # See if this username and password are valid
    cursor.execute("SELECT password FROM users WHERE username=%s", (username,))
    result = cursor.fetchone()
    if not result:
        print(f"Found no user profile matching username={username}")
        raise NameError("Invalid credentials")
    
    stored_password_hash = result[0]

    if not bcrypt.checkpw(password.encode('utf-8'), stored_password_hash.encode('utf-8')):
        print(f"Password is wrong for username={username}")
        raise NameError("Invalid credentials")

    # Delete user from table if credential validation succeeds
    cursor.execute(
        "DELETE FROM users WHERE username=%s", (username,))
    conn.commit()

    print(f"Successfully deleted user profile for username={username}")
