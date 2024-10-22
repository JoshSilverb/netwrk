"""db_accessor.py"""

import psycopg2
import psycopg2.extras


class Db_config:
    def __init__(self, db_host, db_name, db_user, db_pwd, db_port):
        self.db_host = db_host
        self.db_name = db_name
        self.db_user = db_user
        self.db_pwd  = db_pwd
        self.db_port = db_port

def get_contacts_for_user(username, db_config: Db_config):
    try:
        # Connect to PostgreSQL database
        conn = psycopg2.connect(
            host=db_config.db_host,
            database=db_config.db_name,
            user=db_config.db_user,
            password=db_config.db_pwd,
            port=db_config.db_port
        )

        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Execute a query
        cursor.execute(
            "SELECT contact_id, fullname, location, emailaddress, phonenumber, userbio \
             FROM contacts \
             INNER JOIN users ON contacts.user_id=users.user_id \
             WHERE users.username=%s;",
            (username,))

        
        rawRows = cursor.fetchall()

        rows = [dict(row) for row in rawRows]

        # Close connections
        cursor.close()
        conn.close()

        # Return the query results as list of dicts
        return "", rows

    except Exception as e:
        return str(e), []


def add_contact_for_user(username, contact, db_config: Db_config):
    try:
        # Connect to PostgreSQL database
        conn = psycopg2.connect(
            host=db_config.db_host,
            database=db_config.db_name,
            user=db_config.db_user,
            password=db_config.db_pwd,
            port=db_config.db_port
        )

        cursor = conn.cursor()

        # Check that username is an acual user (and isn't exceeding their limits)
        cursor.execute("SELECT user_id FROM users WHERE username=%s", (username,))

        result = cursor.fetchall()
        if len(result) == 0:
            raise Exception("Unable to add new contact - user '"+username+"' not found")

        user_id = result[0]

        # Execute a query
        cursor.execute(
            "INSERT INTO contacts \
             (user_id, fullname, location, emailaddress, phonenumber, userbio) VALUES \
             (%s, %s, %s, %s, %s, %s) RETURNING contact_id",
            (user_id, contact["fullname"], contact["location"], contact["emailaddress"], 
             contact["phonenumber"], contact["userbio"]))
        id_of_new_row = cursor.fetchone()[0]
        conn.commit()

        # Close connections
        cursor.close()
        conn.close()

        return True, str(id_of_new_row)
    except Exception as e:
        return False, str(e)
    

def remove_contact_for_user(username, contact_id, db_config: Db_config):
    try:
        # Connect to PostgreSQL database
        conn = psycopg2.connect(
            host=db_config.db_host,
            database=db_config.db_name,
            user=db_config.db_user,
            password=db_config.db_pwd,
            port=db_config.db_port
        )

        cursor = conn.cursor()

        # Check that username is an acual user, and owns this contact
        cursor.execute(
            "SELECT contacts.user_id \
             FROM users \
             INNER JOIN contacts ON contacts.user_id=users.user_id \
             WHERE users.username=%s AND contacts.contact_id=%s", 
            (username, contact_id))

        result = cursor.fetchall()
        if len(result) == 0:
            raise Exception("Unable to add new contact - \
                            no contact with ID '"+user_id+"' for user "+username)
        user_id = result[0]

        # Execute a query
        cursor.execute("DELETE FROM contacts WHERE contact_id=%s AND user_id=%s", (contact_id, user_id))
        conn.commit()
        rows_deleted = cursor.rowcount

        # Close connections
        cursor.close()
        conn.close()

        # Return the number of rows affected
        return rows_deleted, True
    except Exception as e:
        return str(e), False
    


def get_contact_by_id(username, contact_id, db_config: Db_config):
    try:
        # Connect to PostgreSQL database
        conn = psycopg2.connect(
            host=db_config.db_host,
            database=db_config.db_name,
            user=db_config.db_user,
            password=db_config.db_pwd,
            port=db_config.db_port
        )

        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Check that username is an acual user, and owns this contact
        cursor.execute("SELECT user_id,  FROM users WHERE username=%s", (username,))

        result = cursor.fetchall()
        if len(result) == 0:
            raise Exception("Unable to add new contact - user '"+username+"' not found")

        user_id = result[0]


        # Execute a query
        cursor.execute(
            "SELECT contact_id, fullname, location, emailaddress, phonenumber, userbio \
             FROM contacts \
             WHERE contact_id=%s;",
            (contact_id,))

        rawRows = cursor.fetchall()

        if len(rawRows) == 0:
             return "", []

        rows = [dict(row) for row in rawRows]

        # Close connections
        cursor.close()
        conn.close()

        # Return the query results as list of dicts
        return "", rows

    except Exception as e:
        return str(e), []
