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


def get_contacts_for_user(user_token, db_config: Db_config):
    
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
            WHERE users.user_token=%s;",
        (user_token,))

    
    rawRows = cursor.fetchall()

    rows = [dict(row) for row in rawRows]

    # Close connections
    cursor.close()
    conn.close()

    # Return the query results as list of dicts
    return rows



def add_contact_for_user(user_token, contact, db_config: Db_config):
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=db_config.db_host,
        database=db_config.db_name,
        user=db_config.db_user,
        password=db_config.db_pwd,
        port=db_config.db_port
    )

    cursor = conn.cursor()

    # Check that user is an acual user (and isn't exceeding their limits)
    cursor.execute("SELECT user_id FROM users WHERE user_token=%s", (user_token,))

    result = cursor.fetchall()
    if len(result) == 0:
        raise Exception("Unable to add new contact - user token '"+user_token+"' not found")

    user_id = result[0]

    # Execute a query
    cursor.execute(
        "INSERT INTO contacts \
            (user_id, fullname, location, emailaddress, phonenumber, userbio) VALUES \
            (%s, %s, %s, %s, %s, %s) RETURNING contact_id",
        (user_id, contact["fullname"], contact["location"], contact["emailaddress"], 
            contact["phonenumber"], contact["userbio"]))
    id_of_new_row = cursor.fetchone()[0]

    # Update corresponding user's num_contacts
    cursor.execute(
        "UPDATE users SET num_contacts = num_contacts + 1 WHERE user_token=%s",
        (user_token,))
    conn.commit()

    # Close connections
    cursor.close()
    conn.close()

    return str(id_of_new_row)
    

def remove_contact_for_user(user_token, contact_id, db_config: Db_config):
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=db_config.db_host,
        database=db_config.db_name,
        user=db_config.db_user,
        password=db_config.db_pwd,
        port=db_config.db_port
    )

    cursor = conn.cursor()

    # Check that user is an acual user, and owns this contact
    cursor.execute(
        "SELECT contacts.user_id \
            FROM users \
            INNER JOIN contacts ON contacts.user_id=users.user_id \
            WHERE users.user_token=%s AND contacts.contact_id=%s", 
        (user_token, contact_id))

    result = cursor.fetchall()
    if len(result) == 0:
        raise Exception("Unable to remove contact - "
                        "no contact with ID '"+user_id+"' "
                        "for user_token "+user_token)
    user_id = result[0]

    # Execute a query
    cursor.execute("DELETE FROM contacts WHERE contact_id=%s AND user_id=%s", (contact_id, user_id))
    conn.commit()
    rows_deleted = cursor.rowcount

    if (rows_deleted != 1):
        raise Exception("Failed to remove contact, deleted",
                        rows_deleted, "rows")
    
    # Update corresponding user's num_contacts
    cursor.execute(
        "UPDATE users SET num_contacts = num_contacts - 1 WHERE user_token=%s",
        (user_token,))
    conn.commit()

    # Close connections
    cursor.close()
    conn.close()
    

def get_contact_by_id(user_token, contact_id, db_config: Db_config):
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=db_config.db_host,
        database=db_config.db_name,
        user=db_config.db_user,
        password=db_config.db_pwd,
        port=db_config.db_port
    )

    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    cursor.execute(
        "SELECT contacts.user_id \
            FROM users \
            INNER JOIN contacts ON contacts.user_id=users.user_id \
            WHERE users.user_token=%s AND contacts.contact_id=%s", 
        (user_token, contact_id))

    # Check that user is an acual user and owns this contact, and extract 
    # contact info.
    cursor.execute(
        "SELECT \
            contacts.contact_id, \
            contacts.fullname, \
            contacts.location, \
            contacts.emailaddress, \
            contacts.phonenumber, \
            contacts.userbio \
        FROM users \
            INNER JOIN contacts ON contacts.user_id=users.user_id \
            WHERE users.user_token=%s AND contacts.contact_id=%s", 
        (user_token, contact_id))

    rawRows = cursor.fetchall()

    if len(rawRows) == 0:
            return "", []

    row = dict(rawRows[0])

    # Close connections
    cursor.close()
    conn.close()

    # Return the query results as list of dicts
    return row


def update_contact_for_user(user_token, contact, db_config: Db_config):
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=db_config.db_host,
        database=db_config.db_name,
        user=db_config.db_user,
        password=db_config.db_pwd,
        port=db_config.db_port
    )

    cursor = conn.cursor()

    # Check that user is an acual user (and isn't exceeding their limits)
    cursor.execute("SELECT user_id FROM users WHERE user_token=%s", (user_token,))

    result = cursor.fetchall()
    if len(result) == 0:
        raise Exception("Unable to update contact - user_token '"+user_token+"' not found")

    user_id = result[0]

    # Execute a query
    cursor.execute(
        "UPDATE contacts \
            SET user_id=%s, fullname=%s, location=%s, emailaddress=%s, phonenumber=%s, userbio=%s \
            WHERE contact_id=%s",
        (user_id, contact["fullname"], contact["location"], contact["emailaddress"], 
            contact["phonenumber"], contact["userbio"], contact["contact_id"]))
    conn.commit()

    # Close connections
    cursor.close()
    conn.close()

    return contact["contact_id"]