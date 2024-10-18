"""db_accessor.py"""

import json
import psycopg2

from get_secret import get_db_password

DB_SECRETS = get_db_password()

DB_HOST = DB_SECRETS["host"]
DB_NAME = "netwrkdb"
DB_USER = DB_SECRETS["username"]
DB_PASSWORD = DB_SECRETS["password"]
DB_PORT = DB_SECRETS["port"]

def get_contacts_for_user(username):
    try:
        # Connect to PostgreSQL database
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )

        cursor = conn.cursor()

        # Execute a query
        cursor.execute(
            "SELECT contact_id, fullname, location, emailaddress, phonenumber, userbio \
             FROM contacts \
             INNER JOIN users ON contacts.user_id=users.user_id \
             WHERE users.username=%s;",
            (username,))

        rows = cursor.fetchall()

        # Close connections
        cursor.close()
        conn.close()

        # Return the query results as list of dicts
        return "", rows

    except Exception as e:
        return str(e), ""

def add_contact_for_user(username, contact):
    pass