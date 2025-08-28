
import bcrypt
import psycopg2
import psycopg2.extras
import uuid
import logging

from app.aws import method_args
from app.database.db_config import Db_config
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from enum import Enum

logger = logging.getLogger(__name__)



class SortOptions(Enum):
    DATE_ADDED = 'Date added'
    LAST_CONTACT_NEWEST = 'Last contacted (newest)'
    LAST_CONTACT_OLDEST = 'Last contacted (oldest)'
    ALPHABETICAL = 'Alphabetical'
    DISTANCE = 'Distance'
    RELEVANCE = 'Relevance'
    NEXT_CONTACT_DATE = 'Next contact date'


def sort_option_from_string(option: str) -> SortOptions:
    """
    Convert the given string to a SortOptions enum value.
    Args:
        option (str): The string to convert.
    Returns:
        SortOptions: The corresponding SortOptions enum value.
    Raises:
        ValueError: If the given string is not a valid sort option.
    """

    logger.debug(f"Processing sort option: {option}")
    option = option.strip("'")
    logger.debug(f"Stripped sort option: {option}")

    for sortOpt in SortOptions:
        logger.debug(f"Comparing to sort option: {sortOpt.value}")
        if sortOpt.value == option:
            return sortOpt
    
    logger.debug("Sort option not found")
    raise ValueError(f"'{option}' is not a valid sort option")


class Db_Accessor:
    """
    Class for managing interaction with the database.
    """

    #######################
    # PRIVATE METHODS
    #######################

    def _add_contact_to_db_with_coord(self, cursor, user_id, fullname, location, coordinate, user_bio, last_contact, met_through, reminder_period_weeks, reminder_period_months, next_contact, embedding_vector):
        """
        Add the given variables to the database as a new contact with 
            coordinates set.
        
        Returns:
            the contact ID of the newly added contact
        """

        # Execute a query
        cursor.execute(
            "INSERT INTO contacts \
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
    

    def _add_contact_to_db_no_coord(self, cursor, user_id, fullname, location, user_bio, last_contact, met_through, reminder_period_weeks, reminder_period_months, next_contact, embedding_vector):
        """
        Add the given variables to the database as a new contact without 
            coordinates set.
        
        Returns:
            the contact ID of the newly added contact
        """

        # Execute a query
        cursor.execute(
            "INSERT INTO contacts \
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



    def _update_contact_in_db_with_coord(self, cursor, user_id, contact_id, fullname, location, coordinate, user_bio, last_contact, met_through, reminder_period_weeks, reminder_period_months, next_contact, embedding_vector):
        """
        Add the given variables to the database as a new contact with 
            coordinates set.
        
        Returns:
            the contact ID of the newly added contact
        """

        # Execute a query
        cursor.execute(
            f"UPDATE contacts \
                SET \
                    user_id=%s, \
                    fullname=%s, \
                    location=%s, \
                    coordinates=ST_GeogFromText('SRID=4326;POINT(%s %s)'), \
                    metthrough=%s, \
                    userbio=%s, \
                    lastcontact=%s, \
                    remind_in_weeks=%s, \
                    remind_in_months=%s, \
                    nextcontact=%s, \
                    embedding=%s \
                WHERE contact_id=%s",
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
            embedding_vector,
            contact_id))
    

    def _update_contact_in_db_no_coord(self, cursor, user_id, contact_id, fullname, location, user_bio, last_contact, met_through, reminder_period_weeks, reminder_period_months, next_contact, embedding_vector):
        """
        Add the given variables to the database as a new contact without 
            coordinates set.
        
        Returns:
            the contact ID of the newly added contact
        """

        # Execute a query
        cursor.execute(
            f"UPDATE contacts \
            SET \
                user_id=%s, \
                fullname=%s, \
                location=%s, \
                metthrough=%s, \
                userbio=%s, \
                lastcontact=%s, \
                remind_in_weeks=%s, \
                remind_in_months=%s, \
                nextcontact=%s, \
                embedding=%s \
            WHERE contact_id=%s",
            (user_id, 
            fullname,
            location,
            met_through,
            user_bio,
            last_contact, 
            reminder_period_weeks,
            reminder_period_months,
            next_contact,
            embedding_vector,
            contact_id))


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
            new_contact_id = self._add_contact_to_db_with_coord(cursor, user_id, fullname, location, coordinate, user_bio, last_contact, met_through, reminder_period_weeks, reminderPeriod_months, nextcontact, embedding_vector)
        else:
            new_contact_id = self._add_contact_to_db_no_coord(cursor, user_id, fullname, location, user_bio, last_contact, met_through, reminder_period_weeks, reminderPeriod_months, nextcontact, embedding_vector)

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
        


    def update_contact_for_user(self, request_args: method_args.UpdateContactArgs, coordinate: dict[str, str] | None, embedding_vector: list[float]) -> int:
        """
        Add the contact defined by the given args to the database
        Args:
            args: a UpdateContactArgs dict
            coordinates: coordinate representation of request_args['location']; 
                         can be None if the coordinates can't be determined
            embedding_vector: embedding of some fields in request_args
        Returns:
            The contact ID of the updated contact as an int
        """
        
        # Unpack the args
        user_token = request_args['user_token'] 
        contact_id = request_args['contact_id']
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
        cursor = conn.cursor()

        # Check that user is an acual user (and isn't exceeding their limits)
        cursor.execute("SELECT user_id FROM users WHERE user_token=%s", (user_token,))

        result = cursor.fetchall()
        if len(result) == 0:
            raise Exception("Unable to update contact - user_token '"+user_token+"' not found")

        user_id = result[0]

        reminderPeriod_days = reminder_period_weeks * 7
        reminderPeriod_months = reminder_period_months

        nextcontact = last_contact + relativedelta(months=+reminderPeriod_months, days=+reminderPeriod_days)

        print("Main update query, coordinate =", coordinate)

        if coordinate:
            print("Has coordinate")
            self._update_contact_in_db_with_coord(cursor, user_id, contact_id, fullname, location, coordinate, user_bio, last_contact, met_through, reminder_period_weeks, reminder_period_months, nextcontact, embedding_vector)
        else:
            print("No coordinate")
            self._update_contact_in_db_no_coord(cursor, user_id, contact_id, fullname, location, user_bio, last_contact, met_through, reminder_period_weeks, reminder_period_months, nextcontact, embedding_vector)
        conn.commit()

        print("Main update query finished")

        # Remove and reinsert socials and tags
        print("Deleting all socials")

        cursor.execute(
            "DELETE FROM socials WHERE contact_id=%s",
            (contact_id,))
        conn.commit()
        print("Deleting all socials finished")

        social_labels = [s["label"] for s in socials]
        addresses = [s["address"] for s in socials]
        
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
            contact_id,  # Contact ID
            social_labels,  # Labels for inserting into socials
            addresses)  # Addresses for inserting into socials
        )
        conn.commit()

        
        # Delete and add back tags

        print("Deleting all tags")

        cursor.execute(
            "DELETE FROM tags WHERE contact_id=%s",
            (contact_id,))
        conn.commit()
        print("Deleting all tags finished")
        print("tags:", tags)
        
        cursor.execute("SELECT * FROM tags WHERE contact_id=%s", (contact_id,))
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
            (user_id, tags,  # For new_tags selection
            user_id, tags,  # For inserting new labels
            user_id,  # For LEFT JOIN check
            contact_id  # For inserting into tags table
            )
        )
        conn.commit()

        print("Updating all socials finished")

        cursor.execute("SELECT * FROM tags WHERE contact_id=%s", (contact_id,))
        result = cursor.fetchall()

        print("Tags currently in DB:", result)

        # Close connections
        cursor.close()
        conn.close()

        return contact_id


    def get_tags_for_user(self, request_args: method_args.GetTagsForUserArgs) -> int:
        """
        Get the tags associatd with the user with the user ID in the given args.
        Args:
            args: a GetTagsForUserArgs dict
        Returns:
            The tags associated with the user with the user ID given in the args.
        """
        
        # Unpack the args
        user_token = request_args['user_token'] 

        # Connect to PostgreSQL database
        conn = self._get_db_connection()
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
    

    def store_user_credentials(self, request_args: method_args.StoreUserCredentialsArgs) -> int:
        """
        Store the user credentials defined in the given args, and generate and store a new user token.
        Args:
            args: a StoreUserCredentialsArgs dict
        Returns:
            The new user token associated with this user.
        """
        
        # Unpack the args
        username = request_args['username'] 
        password = request_args['password'] 

        # Connect to PostgreSQL database
        conn = self._get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Make sure nobody else has this username
        cursor.execute("SELECT COUNT(*) FROM users WHERE username=%s", (username,))
        usernameCount = cursor.fetchone()[0]

        print(f"Found {usernameCount} other users with the username={username}")

        if usernameCount != 0:
            raise NameError("Username already taken")

        # Add new user to DB if not
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user_token = str(uuid.uuid4().hex).strip()

        cursor.execute(
            "INSERT INTO users (username, user_token, password) \
                VALUES (%s, %s, %s)",
            (username, user_token, hashed_password.decode('utf-8')))
        conn.commit()

        print(f"Successfully created user profile for username={username}")

        return user_token


    def validate_user_credentials(self, request_args: method_args.ValidateUserCredentialsArgs) -> int:
        """
        Validate the user credentials defined in the given args against the stored credentials in the database, and generate and store a new user token.
        Args:
            args: a ValidateUserCredentialsArgs dict
        Returns:
            The new user token associated with this user.
        """
        
        # Unpack the args
        username = request_args['username'] 
        password = request_args['password'] 

        # Connect to PostgreSQL database
        conn = self._get_db_connection()
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


    def delete_user(self, request_args: method_args.DeleteUserArgs) -> int:
        """
        Delete the user associated with the user token defined in the given args.
        Args:
            args: a DeleteUserArgs dict
        Returns:
            None.
        """
        
        # Unpack the args
        user_token = request_args['user_token'] 

        # Connect to PostgreSQL database
        conn = self._get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # See if this user token is valid
        cursor.execute("SELECT COUNT(*) FROM users WHERE user_token=%s", (user_token,))
        profilesCount = cursor.fetchone()[0]
        
        print(f"Found {profilesCount} profiles with user_token={user_token}")

        if profilesCount == 0:
            raise NameError("No profiles matching the specified user token")

        # Delete user from table if user token validation succeeds
        cursor.execute(
            "DELETE FROM users WHERE user_token=%s", (user_token,))
        conn.commit()

        print(f"Successfully deleted user profile with user_token={user_token}")


    def get_user_details(self, request_args: method_args.GetUserDetailsArgs) -> int:
        """
        Get the details of the user associated with the user token defined in the given args.
        Args:
            args: a GetUserDetailsArgs dict
        Returns:
            The details of the specified user.
        """
        
        # Unpack the args
        user_token = request_args['user_token'] 

        # Connect to PostgreSQL database
        conn = self._get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Get user info
        cursor.execute("SELECT username, num_contacts FROM users WHERE user_token=%s", (user_token,))    
        rawRows = cursor.fetchall()

        if len(rawRows) == 0:
            raise NameError("No profiles matching the specified user token")

        row = dict(rawRows[0])

        # Close connections
        cursor.close()
        conn.close()

        return row
    

    def get_socials_for_contacts(self, contacts):
        """
        Search the database for socials for all given contacts
        Args:
            ...
        Returns:
            The given list of contacts with populated 'socials' fields
        """

        # Connect to PostgreSQL database
        conn = self._get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

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


    def search_contacts_and_sort(self, request_args: method_args.SearchContactsArgs, embedding_string):
        """
        Search the database for contacts matching the requirements in the given 
            args and sorted by the given sort operation.
        Args:
            ...
        Returns:
            A list of contacts matching the given args
        """

        # Unpack the args
        user_token = request_args['user_token'] 
        query_string = request_args['query_string']
        sort_option: SortOptions = sort_option_from_string(request_args['order_by'])
        tags = request_args['tags']
        lower_bound_date = request_args['lower_bound_date']
        upper_bound_date = request_args['upper_bound_date']
        user_lat = request_args['user_latitude']
        user_lon = request_args['user_longitude']

        # Connect to PostgreSQL database
        conn = self._get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Can't search by relevance to a query if no query is given
        print(f"sort_option: {sort_option}, query_string: '{query_string}'")
        if sort_option == SortOptions.RELEVANCE and len(query_string) == 0:
            print("Can't search by relevance to a query if no query is given")
            sort_option = SortOptions.DATE_ADDED
        
        # Can't search by distance in no coordinate is given
        if sort_option == SortOptions.DISTANCE and (not user_lat or not user_lon):
            sort_option = SortOptions.DATE_ADDED
            
        # Set ordering operation
        match sort_option:
            case SortOptions.DATE_ADDED:
                order_operation = f'contact_id DESC'
            case SortOptions.LAST_CONTACT_NEWEST:
                order_operation = 'lastcontact DESC'
            case SortOptions.LAST_CONTACT_OLDEST:
                order_operation = 'lastcontact ASC'
            case SortOptions.ALPHABETICAL:
                order_operation = 'fullname ASC'
            case SortOptions.DISTANCE:
                order_operation = f'coordinates <-> St_MakePoint({user_lon}, {user_lat})'
            case SortOptions.RELEVANCE:
                order_operation = f"embedding <-> '{embedding_string}' LIMIT 15"
            case SortOptions.NEXT_CONTACT_DATE:
                order_operation = 'nextcontact ASC'

        # Prepare to set query filter if filtering by exact query match
        if sort_option != SortOptions.RELEVANCE:
            exact_match_query = "AND ( contacts.userbio ILIKE %(search_term)s OR contacts.fullname ILIKE %(search_term)s )"
        else:
            exact_match_query = ""

        # Prepare to set tags filter if tags are given
        if len(tags) == 0:
            tags_join = ""
            tags_operation = ""
        else:
            print("Using tags:", tags)
            tags_join = "INNER JOIN tags ON tags.contact_id = contacts.contact_id \
                        INNER JOIN taglabels ON taglabels.id = tags.tag_id"
            tags_operation = "AND taglabels.label = ANY(%(tags)s::text[])"
        
        search_term = f"%{query_string}%"

        query_parameters = {
            'user_token': user_token, 
            'search_term': search_term, 
            'lower_bound_date': lower_bound_date, 
            'upper_bound_date': upper_bound_date,
            'tags': tags,
            'embedding_string': embedding_string,
        }

        print(f"Sorting by {sort_option}")
        print(f"about to execute with params: {query_parameters}")
        print(f"and sql query:\nSELECT \
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
            ORDER BY {order_operation};")

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
            ORDER BY {order_operation};", 
            query_parameters)

        rawRows = cursor.fetchall()
        print(f"fetched {len(rawRows)} contacts")

        cursor.close()
        conn.close()
        
        contacts = [dict(row) for row in rawRows]

        return contacts
