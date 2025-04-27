
import psycopg2
import psycopg2.extras

from aws import method_args
from database.db_accessor import Db_Accessor, sort_option_from_string


class Contact_Searcher:
    """
    Class for managing interaction with the database.
    """


    #######################
    # PRIVATE METHODS
    #######################



    # def _get_db_connection(self):
    #     """
    #     Initialize a connection to the database according to the config passed 
    #     on this object's construction.
        
    #     Returns:
    #         A psycopg2 connection object connected to the databse 
    #     """

    #     return psycopg2.connect(host=self.db_config.db_host,
    #                             database=self.db_config.db_name,
    #                             user=self.db_config.db_user,
    #                             password=self.db_config.db_pwd,
    #                             port=self.db_config.db_port)
    

    # def _search_by_
    

    #######################
    # CONSTRUCTORS
    #######################


    def __init__(self, db_accessor: Db_Accessor):
        """
        Initialize a 'Contact_Searcher' object that connects to the database as 
        specified by 'config'.
        """

        self.db_accessor = db_accessor


    #######################
    # PUBLIC METHODS
    #######################


    def search_contacts(self, request_args: method_args.SearchContactsArgs, coordinate: dict[str, str] | None, embedding_vector: list[float]) -> int:
        """
        Search the database for contacts matching the requirements in the given args.
        Args:
            args: a SearchContactsArgs dict
        Returns:
            A list of contacts matching the given args
        """
        
        # Unpack the args
        user_token = request_args['user_token'] 
        query_string = request_args['query_string']
        order_by = sort_option_from_string(request_args['order_by'])
        tags = request_args['tags']
        lower_bound_date = request_args['lower_bound_date']
        upper_bound_date = request_args['upper_bound_date']
        user_latitude = request_args['user_latitude']
        user_longitude = request_args['user_longitude']

        ### TODO: call search_contacts_and_sort and get_socials_for_contacts

        contacts = 


        # Connect to PostgreSQL database
        conn = self._get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

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

