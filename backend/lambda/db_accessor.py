"""db_accessor.py"""

import psycopg2
import psycopg2.extras
from datetime import date


class Db_config:
    def __init__(self, db_host, db_name, db_user, db_pwd, db_port):
        self.db_host = db_host
        self.db_name = db_name
        self.db_user = db_user
        self.db_pwd  = db_pwd
        self.db_port = db_port

sortOptions = {
        'Date added': 'contact_id DESC', 
        'Last contacted (newest)': 'lastcontact DESC', 
        'Last contacted (oldest)': 'lastcontact ASC', 
        'Alphabetical': 'fullname ASC'}


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
        "SELECT contact_id, fullname, location, coordinates, userbio \
            FROM contacts \
            INNER JOIN users ON contacts.user_id=users.user_id \
            WHERE users.user_token=%s;",
        (user_token,))
    
    rawRows = cursor.fetchall()

    contacts = [dict(row) for row in rawRows]

    for c in contacts:
        # Pull socials into contact before returning
        cursor.execute("SELECT sl.label as label, s.address as address \
                        FROM socials s  \
                        JOIN sociallabels sl \
                            ON s.social_id = sl.id \
                        WHERE s.contact_id = %s",
                        (c['contact_id'],))
        rawSocials = cursor.fetchall()

        if len(rawSocials) > 0:
            socials = dict(rawSocials[0])
            c['socials'] = socials
        else:
            c['socials'] = []

    # Close connections
    cursor.close()
    conn.close()

    # Return the query results as list of dicts
    return contacts


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
            (user_id, \
             fullname, \
             location, \
             metthrough, \
             userbio, \
             lastcontact, \
             importance) VALUES \
            (%s, %s, %s, %s, %s, %s, %s) RETURNING contact_id",
        (user_id, 
         contact["fullname"], 
         contact["location"],
         contact["metthrough"], 
         contact["userbio"], 
         contact["lastcontact"], 
         contact["importance"]))
    new_contact_id = cursor.fetchone()[0]

    # Add socials
    
    social_labels = [s["label"] for s in contact['socials']]
    addresses = [s["address"] for s in contact['socials']]

    cursor.execute(
        """WITH new_socials AS (
            SELECT id, label FROM sociallabels WHERE label = ANY(%s)
        ), inserted AS (
            INSERT INTO sociallabels (label)
            SELECT unnest(%s)
            WHERE NOT EXISTS (
                SELECT 1 
                FROM new_socials 
                WHERE new_socials.label IN (SELECT unnest(%s))
            )
            RETURNING id, label
        )
        INSERT INTO socials (contact_id, social_id, address)
        SELECT %s, sl.id, data.address
        FROM (
            SELECT unnest(%s) AS label, unnest(%s) AS address
        ) data
        JOIN (SELECT id, label FROM new_socials UNION ALL SELECT id, label FROM inserted) sl
        ON data.label = sl.label;""", 
        (social_labels, 
         social_labels, 
         social_labels, 
         new_contact_id, 
         social_labels, 
         addresses)
    )
    conn.commit()

    # Add tags
    
    cursor.execute(
        """
        -- Insert new tags into taglabels (if they don't already exist)
        WITH new_tags AS (
            SELECT id, label FROM taglabels WHERE user_id = %s AND label = ANY(%s)
        ), inserted AS (
            INSERT INTO taglabels (user_id, label)
            SELECT %s, unnest(%s)
            WHERE NOT EXISTS (
                SELECT 1 FROM new_tags WHERE new_tags.label IN (SELECT unnest(%s))
            )
            RETURNING id, label
        )
        -- Insert corresponding entries into the tags table
        INSERT INTO tags (contact_id, tag_id)
        SELECT %s, tl.id
        FROM (
            SELECT id, label FROM new_tags 
            UNION ALL 
            SELECT id, label FROM inserted
        ) tl;""", 
        (user_id, 
         contact['tags'], 
         user_id, 
         contact['tags'], 
         contact['tags'],
         new_contact_id)
    )
    conn.commit()

    # Update corresponding user's num_contacts
    cursor.execute(
        "UPDATE users SET num_contacts = num_contacts + 1 WHERE user_token=%s",
        (user_token,))
    conn.commit()
    print("done")

    # Close connections
    cursor.close()
    conn.close()

    return str(new_contact_id)
    

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
    
    # Note that contacts and tags get deleted automatically on cascade when this gets deleted.

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

    # Check that user is an acual user and owns this contact, and extract 
    # contact info.
    cursor.execute(
        "SELECT \
            contacts.contact_id, \
            contacts.fullname, \
            contacts.location, \
            contacts.metthrough, \
            contacts.userbio, \
            contacts.lastcontact, \
            contacts.importance \
        FROM users \
            INNER JOIN contacts ON contacts.user_id=users.user_id \
            WHERE users.user_token=%s AND contacts.contact_id=%s", 
        (user_token, contact_id))

    rawRows = cursor.fetchall()

    if len(rawRows) == 0:
        cursor.close()
        conn.close()
        return []

    contact = dict(rawRows[0])

    # Parse date to string - TODO: change date string formatting to use month word
    contact['lastcontact'] = contact['lastcontact'].strftime('%Y-%m-%d')

    # Pull socials into contact
    cursor.execute("SELECT sl.label as label, s.address as address \
                    FROM socials s  \
                    JOIN sociallabels sl \
                        ON s.social_id = sl.id \
                    WHERE s.contact_id = %s",
                    (contact_id,))
    rawSocials = cursor.fetchall()

    socials = [{"label": label, "address": address} for label, address in rawSocials]

    contact['socials'] = socials
    
    # Pull tags into contact
    cursor.execute("SELECT tl.label as label \
                    FROM tags  \
                    JOIN taglabels tl \
                        ON tags.tag_id = tl.id \
                    WHERE tags.contact_id = %s",
                    (contact_id,))
    rawTags = cursor.fetchall()

    tags = [t[0] for t in rawTags]

    contact['tags'] = tags

    # Close connections
    cursor.close()
    conn.close()

    # Return the query results as list of dicts
    return contact


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

    print("Main update query")

    # Execute a query
    cursor.execute(
        "UPDATE contacts \
            SET user_id=%s, fullname=%s, location=%s, metthrough=%s, userbio=%s, lastcontact=%s, importance=%s \
            WHERE contact_id=%s",
        (user_id, contact["fullname"], contact["location"], contact["metthrough"], contact["userbio"], 
            contact["lastcontact"], contact["importance"], contact["contact_id"]))
    conn.commit()
    print("Main update query finished")

    # Remove and reinsert socials and tags
    print("Deleting all socials")

    cursor.execute(
        "DELETE FROM socials WHERE contact_id=%s",
        (contact['contact_id'],))
    conn.commit()
    print("Deleting all socials finished")

    social_labels = [s["label"] for s in contact['socials']]
    addresses = [s["address"] for s in contact['socials']]
    
    cursor.execute(
        """WITH new_socials AS (
            SELECT id, label FROM sociallabels WHERE label = ANY(%s)
        ), inserted AS (
            INSERT INTO sociallabels (label)
            SELECT unnest(%s)
            WHERE NOT EXISTS (
                SELECT 1 
                FROM new_socials 
                WHERE new_socials.label IN (SELECT unnest(%s))
            )
            RETURNING id, label
        )
        INSERT INTO socials (contact_id, social_id, address)
        SELECT %s, sl.id, data.address
        FROM (
            SELECT unnest(%s) AS label, unnest(%s) AS address
        ) data
        JOIN (SELECT id, label FROM new_socials UNION ALL SELECT id, label FROM inserted) sl
        ON data.label = sl.label;""", 
        (social_labels, 
         social_labels, 
         social_labels, 
         contact['contact_id'], 
         social_labels, 
         addresses)
    )
    conn.commit()

    
    # Delete and add back tags

    print("Deleting all tags")

    cursor.execute(
        "DELETE FROM tags WHERE contact_id=%s",
        (contact['contact_id'],))
    conn.commit()
    print("Deleting all tags finished")
    print("tags:", contact['tags'])
    
    cursor.execute("SELECT * FROM tags WHERE contact_id=%s", (contact['contact_id'],))
    result = cursor.fetchall()

    print("Tags currently in DB:", result)
    
    cursor.execute(
        """
        WITH new_tags AS (
            SELECT id, label FROM taglabels WHERE user_id = %s AND label = ANY(%s::text[])
        ), inserted AS (
            INSERT INTO taglabels (user_id, label)
            SELECT %s, new_labels.label
            FROM (SELECT unnest(%s::text[]) AS label) new_labels
            LEFT JOIN taglabels tl
            ON tl.user_id = %s AND tl.label = new_labels.label
            WHERE tl.id IS NULL  -- Only insert if label does not exist
            RETURNING id, label
        )
        -- Insert corresponding entries into the tags table
        INSERT INTO tags (contact_id, tag_id)
        SELECT %s, tl.id
        FROM (
            SELECT id, label FROM new_tags 
            UNION ALL 
            SELECT id, label FROM inserted
        ) tl;""", 
        (user_id, contact['tags'],  # For new_tags selection
        user_id, contact['tags'],  # For inserting new labels
        user_id,  # For LEFT JOIN check
        contact['contact_id']  # For inserting into tags table
        )
    )
    conn.commit()


    print("Updating all socials finished")

    cursor.execute("SELECT * FROM tags WHERE contact_id=%s", (contact['contact_id'],))
    result = cursor.fetchall()

    print("Tags currently in DB:", result)

    # Close connections
    cursor.close()
    conn.close()

    return contact["contact_id"]


def search_contacts(user_token, search_params, db_config: Db_config):
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=db_config.db_host,
        database=db_config.db_name,
        user=db_config.db_user,
        password=db_config.db_pwd,
        port=db_config.db_port
    )

    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    query_string = search_params['query_string']
    order_by = search_params['order_by']
    tags = search_params['tags']
    lower_bound_date = search_params['lower_bound_date']
    upper_bound_date = search_params['upper_bound_date']

    search_term = f"%{query_string}%"

    # Check that user is an acual user and owns this contact, and extract 
    # contact info.
    cursor.execute(
        "SELECT \
            contacts.contact_id, \
            contacts.fullname, \
            contacts.location, \
            contacts.userbio \
        FROM users \
            INNER JOIN contacts ON contacts.user_id=users.user_id \
            WHERE users.user_token=%s AND contacts.userbio LIKE %s \
        ORDER BY " + sortOptions[order_by], 
        (user_token, search_term))

    rawRows = cursor.fetchall()

    if len(rawRows) == 0:
        cursor.close()
        conn.close()
        return []

    contacts = [dict(row) for row in rawRows]

    # Probably don't actually need this here, just need socials in get_contact_by_id.

    for c in contacts:
        print("Looking at contact:", c)
        # Pull socials into contact before returning
        cursor.execute("SELECT sl.label as label, s.address as address \
                        FROM socials s  \
                        JOIN sociallabels sl \
                            ON s.social_id = sl.id \
                        WHERE s.contact_id = %s",
                        (c['contact_id'],))
        rawSocials = cursor.fetchall()

        socials = [{"label": label, "address": address} for label, address in rawSocials]

        c['socials'] = socials

    # Close connections
    cursor.close()
    conn.close()

    # Return the query results as list of dicts
    return contacts


def get_tags_for_user(user_token, db_config: Db_config):
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
        "SELECT \
            tl.label \
        FROM taglabels tl \
            INNER JOIN users ON users.user_id=tl.user_id \
            WHERE users.user_token=%s", 
        (user_token,))

    rawTags = cursor.fetchall()
    tags = [tag for [tag] in rawTags]

    return tags
