
import psycopg2
import psycopg2.extras
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from database.db_config import Db_config
from aws import method_args



class Db_Accessor:
    """
    Class for managing interaction with the database.
    """

    #######################
    # PRIVATE METHODS
    #######################

    def _add_contact_to_db(cursor, user_id, fullname, location, coordinate, user_bio, last_contact, met_through, reminder_period_weeks, reminder_period_months, next_contact, embedding_vector):
        """
        Add the given variables to the database as a new contact with 
            coordinates set.
        
        Returns:
            the contact ID of the newly added contact
        """

        # Execute a query
        cursor.execute(
            f"INSERT INTO contacts \
                (user_id, \
                fullname, \
                location, \
                coordinates, \
                metthrough, \
                userbio, \
                lastcontact, \
                remind_in_weeks, \
                remind_in_months, \
                nextcontact, \
                embedding) VALUES \
                (%s, %s, %s, ST_GeogFromText('SRID=4326;POINT(%s %s)'), %s, %s, %s, %s, %s, %s, %s) RETURNING contact_id",
            (user_id,
             fullname,
             location,
             coordinate['lng'],
             coordinate['lat'],
             met_through,
             user_bio,
             last_contact,
             reminder_period_weeks,
             reminder_period_months,
             next_contact,
             embedding_vector))
        new_contact_id = cursor.fetchone()[0]

        return new_contact_id
    

    def _add_contact_to_db(cursor, user_id, fullname, location, user_bio, last_contact, met_through, reminder_period_weeks, reminder_period_months, next_contact, embedding_vector):
        """
        Add the given variables to the database as a new contact without 
            coordinates set.
        
        Returns:
            the contact ID of the newly added contact
        """

        # Execute a query
        cursor.execute(
            f"INSERT INTO contacts \
                (user_id, \
                fullname, \
                location, \
                metthrough, \
                userbio, \
                lastcontact, \
                remind_in_weeks, \
                remind_in_months, \
                nextcontact, \
                embedding) VALUES \
                (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING contact_id",
            (user_id,
             fullname,
             location,
             met_through,
             user_bio,
             last_contact,
             reminder_period_weeks,
             reminder_period_months,
             next_contact,
             embedding_vector))
        new_contact_id = cursor.fetchone()[0]

        return new_contact_id


    def _get_db_connection(self):
        """
        Initialize a connection to the database according to the config passed 
        on this object's construction.
        
        Returns:
            A psycopg2 connection object connected to the databse 
        """

        return psycopg2.connect(host=self.db_config.db_host,
                                database=self.db_config.db_name,
                                user=self.db_config.db_user,
                                password=self.db_config.db_pwd,
                                port=self.db_config.db_port)
    

    #######################
    # CONSTRUCTORS
    #######################


    def __init__(self, config: Db_config):
        """
        Initialize a 'Db_Accessor' object that connects the the database as 
        specified by 'config'.
        """

        self.db_config = config


    #######################
    # PUBLIC METHODS
    #######################


    def get_contact_by_id(self, args: method_args.GetContactByIdArgs):
        """
        Search the database for the details of the contact with the contact ID 
            given in the args
        Args:
            args: a GetContactByIdArgs dict
        Returns:
            A dict representing a contact from the database, with keys equal to 
                the columns of the database
        """

        # Unpack the args
        user_token = args['user_token'] 
        contact_id = args['contact_id']

        # Connect to PostgreSQL database
        conn = self._get_db_connection()

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


    def add_contact_for_user(self, request_args: method_args.AddNewContactArgs, coordinate: dict[str, str] | None, embedding_vector: list[float]) -> int:
        """
        Add the contact defined by the given args to the database
        Args:
            args: a AddNewContactArgs dict
            coordinates: coordinate representation of request_args['location']; 
                         can be None if the coordinates can't be determined
            embedding_vector: embedding of some fields in request_args
        Returns:
            The contact ID of the newly added contact as an int
        """
        
        # Unpack the args
        user_token = request_args['user_token'] 
        fullname = request_args['fullname']
        location = request_args['location']
        user_bio = request_args['user_bio']
        last_contact = request_args['last_contact']
        met_through = request_args['met_through']
        socials = request_args['socials']
        reminder_period_weeks = request_args['reminder_period_weeks']
        reminder_period_months = request_args['reminder_period_months']
        tags = request_args['tags']

        # Connect to PostgreSQL database
        conn = self._get_db_connection()

        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Check that user is an acual user (and isn't exceeding their limits)
        cursor.execute("SELECT user_id FROM users WHERE user_token=%s", (user_token,))

        result = cursor.fetchall()
        if len(result) == 0:
            raise Exception("Unable to add new contact - user token '"+user_token+"' not found")

        user_id = result[0][0]
        
        reminderPeriod_days = reminder_period_weeks * 7
        reminderPeriod_months = reminder_period_months

        nextcontact = last_contact + relativedelta(months=+reminderPeriod_months, days=+reminderPeriod_days)

        # Add contact to database with different SQL command depending on 
        # whether it has a coordinate or not.

        if coordinate:
            new_contact_id = self._add_contact_to_db(user_id, fullname, location, coordinate, user_bio, last_contact, met_through, reminder_period_weeks, reminderPeriod_months, nextcontact, embedding_vector)
        else:
            new_contact_id = self._add_contact_to_db(user_id, fullname, location, user_bio, last_contact, met_through, reminder_period_weeks, reminderPeriod_months, nextcontact, embedding_vector)

        print("Inserted into contacts")
        # Add socials

        if len(socials) != 0:
            social_labels = [s["label"] for s in socials]
            addresses = [s["address"] for s in socials]

            print("Inserting socials:", socials)

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
        
        if len(tags) != 0:

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
                tags, 
                user_id, 
                tags, 
                tags,
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



    def remove_contact_for_user(self, request_args: method_args.RemoveContactArgs):
        """
        Remove the contact defined by the given args from the database
        Args:
            args: a RemoveContactArgs dict
        Returns:
            none
        """
        # Unpack the args
        user_token = request_args['user_token'] 
        contact_id = request_args['contact_id']

        # Connect to PostgreSQL database
        conn = self._get_db_connection()

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
        

