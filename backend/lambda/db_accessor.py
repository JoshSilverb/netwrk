"""db_accessor.py"""

import psycopg2
import psycopg2.extras
from openai import OpenAI
from datetime import datetime, date
from dateutil.relativedelta import relativedelta


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
        'Alphabetical': 'fullname ASC',
        'Distance': 'coordinates <-> ST_MakePoint',
        'Relevance': 'embedding <-> ',
        'Next contact date': 'nextcontact ASC'
    } 


def add_contact_for_user(user_token, contact, coordinates, embedding_vector, db_config: Db_config):
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

    user_id = result[0][0]
    
    reminderPeriod = contact["reminderPeriod"]

    contact["lastcontact"] = contact["lastcontact"].split("T")[0] # remove trailing Timestamp part, only care about date
    lastcontact = datetime.strptime(contact["lastcontact"], "%Y-%m-%d").date()
    reminderPeriod_days = int(reminderPeriod["weeks"]) * 7
    reminderPeriod_months = int(reminderPeriod["months"])

    nextcontact = lastcontact + relativedelta(months=+reminderPeriod_months, days=+reminderPeriod_days)

    if coordinates:
        coords_var = "coordinates,"
        coords_value = "ST_GeogFromText('SRID=4326;POINT(%s %s)'),"
        query_params = (user_id, 
                        contact["fullname"], 
                        contact["location"],
                        coordinates['lng'],
                        coordinates['lat'],
                        contact["metthrough"], 
                        contact["userbio"], 
                        contact["lastcontact"], 
                        reminderPeriod["weeks"],
                        reminderPeriod["months"],
                        nextcontact,
                        embedding_vector)
    else:
        coords_var = ""
        coords_value = ""
        query_params = (user_id, 
                        contact["fullname"], 
                        contact["location"],
                        contact["metthrough"], 
                        contact["userbio"], 
                        contact["lastcontact"], 
                        reminderPeriod["weeks"],
                        reminderPeriod["months"],
                        nextcontact,
                        embedding_vector)

    print("Query params:", query_params)

    # Execute a query
    cursor.execute(
        f"INSERT INTO contacts \
            (user_id, \
             fullname, \
             location, \
             {coords_var} \
             metthrough, \
             userbio, \
             lastcontact, \
             remind_in_weeks, \
             remind_in_months, \
             nextcontact, \
             embedding) VALUES \
            (%s, %s, %s, {coords_value} %s, %s, %s, %s, %s, %s, %s) RETURNING contact_id",
        query_params)
    new_contact_id = cursor.fetchone()[0]

    print("Inserted into contacts")
    # Add socials

    if len(contact['socials']) != 0:
        social_labels = [s["label"] for s in contact['socials']]
        addresses = [s["address"] for s in contact['socials']]

        print("Inserting socials:", contact['socials'])

        cursor.execute(
            """
            WITH new_socials AS (
                SELECT id, label FROM sociallabels WHERE label = ANY(%s::text[])
            ), inserted AS (
                INSERT INTO sociallabels (label)
                SELECT new_labels.label
                FROM (SELECT unnest(%s::text[]) AS label) new_labels
                LEFT JOIN sociallabels sl ON sl.label = new_labels.label
                WHERE sl.id IS NULL  -- Only insert new labels
                RETURNING id, label
            )
            INSERT INTO socials (contact_id, social_id, address)
            SELECT %s, sl.id, data.address
            FROM (
                SELECT unnest(%s::text[]) AS label, unnest(%s::text[]) AS address
            ) data
            JOIN (
                SELECT id, label FROM new_socials
                UNION ALL
                SELECT id, label FROM inserted
            ) sl ON data.label = sl.label;""", 
            (social_labels,  # Existing social labels
             social_labels,  # For inserting new labels
             new_contact_id,  # Contact ID
             social_labels,  # Labels for inserting into socials
             addresses)  # Addresses for inserting into socials
        )
        conn.commit()
        print("Inserted into socials")

    # Add tags
    
    if len(contact['tags']) != 0:

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
        print("Inserted into tags")

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
            contacts.remind_in_weeks, \
            contacts.remind_in_months, \
            contacts.nextcontact \
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

    # Parse date to string - Format: 15 Jun, 2026
    lastcontactdate = contact['lastcontact']
    contact['lastcontact'] = contact['lastcontact'].strftime('%d %b, %Y')

    if contact['nextcontact'] is not None:
        contact['nextcontact'] = contact['nextcontact'].strftime('%d %b, %Y')
    else:
        # If there is no next contact date, calculate it and put it back into the db
        reminderPeriod_days = int(contact["remind_in_weeks"]) * 7
        reminderPeriod_months = int(contact["remind_in_months"])

        print(f"Calculating next contact with lastcontact={lastcontactdate} of type {type(lastcontactdate)}")
        nextcontact = lastcontactdate + relativedelta(months=+reminderPeriod_months, days=+reminderPeriod_days)
        print(f"Got it! Nextcontact={nextcontact} of type {type(nextcontact)}")
        contact['nextcontact'] = nextcontact.strftime('%d %b, %Y')

        cursor.execute(
            "UPDATE contacts \
                SET nextcontact=%s \
                WHERE contact_id=%s",
            (nextcontact, contact_id))

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


def update_contact_for_user(user_token, contact, coordinates, embedding_vector, db_config: Db_config):
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

    reminderPeriod = contact["reminderPeriod"]

    print(f"calculating last contact date from {contact['lastcontact']}")
    contact["lastcontact"] = contact["lastcontact"].split("T")[0] # remove trailing Timestamp part, only care about date
    lastcontact = datetime.strptime(contact["lastcontact"], "%Y-%m-%d").date()
    reminderPeriod_days = int(reminderPeriod["weeks"]) * 7
    reminderPeriod_months = int(reminderPeriod["months"])

    nextcontact = lastcontact + relativedelta(months=+reminderPeriod_months, days=+reminderPeriod_days)

    print("Main update query")

    if coordinates:
        coords_value = "coordinates=ST_GeogFromText('SRID=4326;POINT(%s %s)'),"
        query_params = (user_id, 
                        contact["fullname"],
                        contact["location"], 
                        coordinates['lng'],
                        coordinates['lat'],
                        contact["metthrough"], 
                        contact["userbio"], 
                        contact["lastcontact"], 
                        reminderPeriod["weeks"],
                        reminderPeriod["months"],
                        nextcontact,
                        embedding_vector,
                        contact["contact_id"])
    else:
        coords_value = ""
        query_params = (user_id, 
                        contact["fullname"],
                        contact["location"],
                        contact["metthrough"],
                        contact["userbio"],
                        contact["lastcontact"], 
                        reminderPeriod["weeks"],
                        reminderPeriod["months"],
                        nextcontact,
                        embedding_vector,
                        contact["contact_id"])

    print("Query params:", query_params)

    # Execute a query
    cursor.execute(
        f"UPDATE contacts \
            SET \
                user_id=%s, \
                fullname=%s, \
                location=%s, \
                {coords_value} \
                metthrough=%s, \
                userbio=%s, \
                lastcontact=%s, \
                remind_in_weeks=%s, \
                remind_in_months=%s, \
                nextcontact=%s, \
                embedding=%s \
            WHERE contact_id=%s",
        query_params)
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
        """
        WITH new_socials AS (
            SELECT id, label FROM sociallabels WHERE label = ANY(%s::text[])
        ), inserted AS (
            INSERT INTO sociallabels (label)
            SELECT new_labels.label
            FROM (SELECT unnest(%s::text[]) AS label) new_labels
            LEFT JOIN sociallabels sl ON sl.label = new_labels.label
            WHERE sl.id IS NULL  -- Only insert new labels
            RETURNING id, label
        )
        INSERT INTO socials (contact_id, social_id, address)
        SELECT %s, sl.id, data.address
        FROM (
            SELECT unnest(%s::text[]) AS label, unnest(%s::text[]) AS address
        ) data
        JOIN (
            SELECT id, label FROM new_socials
            UNION ALL
            SELECT id, label FROM inserted
        ) sl ON data.label = sl.label;""", 
        (social_labels,  # Existing social labels
         social_labels,  # For inserting new labels
         contact['contact_id'],  # Contact ID
         social_labels,  # Labels for inserting into socials
         addresses)  # Addresses for inserting into socials
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


def search_contacts(user_token, search_params, openai_client, db_config: Db_config):
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
    user_latitude = search_params['user_lat'] if 'user_lat' in search_params else None
    user_longitude = search_params['user_lon'] if 'user_lon' in search_params else None

    # If configured to order by relevance and query string is empty, switch to order by Date added

    if order_by == "Relevance" and len(query_string) == 0:
        order_by = "Date added"

    # Embed query string if non-empty and configured to order by relevance

    embedding_string = ""
    if order_by == "Relevance" and len(query_string) != 0:
        embedding_string = "'" + str(openai_client.embeddings.create(
                                   model="text-embedding-3-small",
                                   input=query_string,
                                   encoding_format="float"
                               ).data[0].embedding) + "' LIMIT 10"

    search_term = f"%{query_string}%"
    print(f"about to execute with query: {search_term}, tags: {tags}, date from: {lower_bound_date} to: {upper_bound_date}")

    if len(tags) == 0:
        print("No tags given")
        tags_join = ""
        tags_operation = ""
        # query_parameters = (user_token, search_term, search_term, lower_bound_date, upper_bound_date)
    else:
        print("Using tags:", tags)
        tags_join = "INNER JOIN tags ON tags.contact_id = contacts.contact_id \
                     INNER JOIN taglabels ON taglabels.id = tags.tag_id"
        tags_operation = "AND taglabels.label = ANY(%s::text[])"
        # query_parameters = (user_token, search_term, search_term, lower_bound_date, upper_bound_date, tags)
    
    query_parameters = {
        'user_token': user_token, 
        'search_term': search_term, 
        'lower_bound_date': lower_bound_date, 
        'upper_bound_date': upper_bound_date,
        'tags': tags,
        'embedding_string': embedding_string,
        'order': sortOptions[order_by]
    }
    
    if order_by == 'Distance':
        user_coordinate = f'({user_longitude}, {user_latitude})'
    else:
        user_coordinate = ''

    if order_by != "Relevance":
        exact_match_query = "AND ( contacts.userbio ILIKE %(search_term)s OR contacts.fullname ILIKE %(search_term)s )"
    else:
        exact_match_query = ""

    print(f"About to run query. Order_by={order_by}, order command= 'ORDER BY {sortOptions[order_by]}{user_coordinate}{embedding_string}'")

    cursor.execute(
        f"SELECT \
            contacts.contact_id, \
            contacts.fullname, \
            contacts.location, \
            ST_AsText(contacts.coordinates) as coordinate, \
            contacts.userbio \
        FROM users \
        INNER JOIN contacts ON contacts.user_id = users.user_id \
        {tags_join} \
        WHERE users.user_token=%(user_token)s \
            {exact_match_query} \
            AND contacts.lastcontact >= %(lower_bound_date)s \
            AND contacts.lastcontact <= %(upper_bound_date)s \
            {tags_operation} \
        GROUP BY contacts.contact_id \
        ORDER BY {sortOptions[order_by]}{user_coordinate}{embedding_string};", 
        query_parameters)

    rawRows = cursor.fetchall()
    print(f"fetched {len(rawRows)} contacts")

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
