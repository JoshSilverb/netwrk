"""request_processor.py"""

"""
@purpose: 
"""

import json
import requests
from aws.api_event_translator_util import ApiEventTranslatorUtil as Translator
from database.db_config import Db_config
from database.db_accessor import Db_Accessor
from aws import secrets 
from openai import OpenAI

class RequestProcessor:
    """
    Routes incoming requests to the appropriate handler functions and strips 
    out any AWS-specific data. 
    """

    def _make_return_json(status: int, body: dict) -> dict:
        """
        Compile a JSON dict from the given args to return to the client.

        Returns:
            A JSON dict
        """

        return {
            'statusCode': status,
            'body': body
        }


    def _location_to_coords(self, location: str) -> dict[str, str] | None:
        """
        Get the coordinates of a given location.
        Args:
            location: an address or name of a place as a string
        Returns:
            A dict in the form {'lat': num, 'lng': num} representing the 
                coordinates of the given location if it can be determined, 
                othewise return 'None'
        """

        print(f"Getting coordinates for location {location}")

        if not location == 0:
            return None

        location_url_segment = '+'.join(location.split(' '))
        geocode_request_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={location_url_segment}&key={self.google_api_key}"
        geocode_response = requests.get(geocode_request_url)
        
        geocode_response.raise_for_status()
        location_coords = geocode_response.json()["results"][0]["geometry"]["location"]
        print(f"Parsed location coords: {location_coords}")

    
    def _get_contact_embedding(self, location: str, bio: str) -> list[float]:
        """
        Get the embedding of the given contact fields.
        Args:
            location: an address or name of a place as a string
            bio: user-specified description of the contact as a string
        Returns:
            A 1536-dimensional list representing the embedding of the fields
        """

        embedding_text = f"location='{location}'; bio='{bio}'"
        
        embedding_object = self.openai_api_key.embeddings.create(
            model="text-embedding-3-small",
            input=embedding_text,
            encoding_format="float"
        )

        return embedding_object.data[0].embedding


    def __init__(self):
        """
        Initialize a 'RequestProcessor' object that calls functions of the 
        specified 'requestHandler' to handle incoming requests.
        """

        self._routingTable = {
            "/addContactForUser"      : self._handle_addNewContact,
            "/deleteUser"             : self._handle_deleteUser,
            "/getContactById"         : self._handle_getContactById,
            "/getTagsForUser"         : self._handle_getTagsForUser,
            "/getUserDetails"         : self._handle_getUserDetails,
            "/removeContactForUser"   : self._handle_removeContact,
            "/searchContacts"         : self._handle_searchContacts,
            "/storeUserCredentials"   : self._handle_storeUserCredentials,
            "/updateContactForUser"   : self._handle_updateContact,
            "/validateUserCredentials": self._handle_validateUserCredentials
        }

        self.secrets_client = secrets.get_secrets_client()

        DB_SECRETS = secrets.get_db_secret(self.secrets_client)
        self.db_config = Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

        self.db_accessor = Db_Accessor(self.db_config)

        self.google_api_key = secrets.get_google_api_secret(self.secrets_client)
        self.openai_api_key = secrets.get_openai_api_secret(self.secrets_client)

        self.openai_client = OpenAI(api_key=self.openai_api_key)

    def route_request(self, event, context):
        """
        Pass on the specified 'event' to the appropriate handler function
        and return the handler function's response.
        Args:
            event: AWS API Gateway event given to the Lambda
            context: AWS API Gateway context given to the Lambda
        Returns:
            A dictionary object containing the app's response to the request.
        """

        route_key: list[str] = event['routeKey'].split(' ')
        request_method: str = route_key[0]
        request_path: str = route_key[1]

        return self._routingTable[request_path](event)

    
    def _handle_getContactById(self, event):
        """
        Process a 'GetContactById' request.
        Args:
            event: AWS API Gateway event given to the Lambda
        Returns:
            A dictionary object containing the details of the contact with the 
                given contact ID if the operation succeeds; otherwise an error 
                response with a message describing the request.
        """
        
        getContactByIdArgs = Translator.extract_getContactByIdArgs(event)
        
        print(f"[GetContactForId] Got request with args: {getContactByIdArgs}")

        try:
            contact = self.db_accessor.get_contact_by_id(getContactByIdArgs)
            print(f"[GetContactForId] Successfully retrieved contact: {contact}")
            
            return self._make_return_json(200, contact)
        
        except Exception as e:
            print(f"[GetContactForId] Failed while getting contact with error: {str(e)}")
            return self._make_return_json(500, {'message': str(e)})


    def _handle_searchContacts(self, event):
        """
        Process a 'SearchContacts' request.
        Args:
            event: AWS API Gateway event given to the Lambda
        Returns:
            A dictionary object containing a list of contacts matching the 
                given search parameters if the operation succeeds; otherwise an  
                error response with a message describing the request.
        """
        pass


    def _handle_addNewContact(self, event):
        """
        Process an 'AddNewContact' request.
        Args:
            event: AWS API Gateway event given to the Lambda
        Returns:
            A dictionary object containing the contact ID of the newly added 
                contact if the operation succeeds; otherwise an error response
                with a message describing the request.
        """

        addNewContactArgs = Translator.extract_addNewContactArgs(event)

        print(f"[AddNewContact] Got request with args: {addNewContactArgs}")

        location_coords = self._location_to_coords(addNewContactArgs["location"])
        print(f"[AddNewContact] Got coordinates: {location_coords}")

        # Embedding block

        embedding_vector = self._get_contact_embedding(addNewContactArgs['location'], addNewContactArgs['user_bio'])
        print(f"[AddNewContact] Got embedding vector")

        try:
            new_contact_id = self.db_accessor.add_contact_for_user(addNewContactArgs, location_coords, embedding_vector)
            print(f"[AddNewContact] Successfully added contact")
            return self._make_return_json(200, new_contact_id)
        except Exception as e:
            print(f"[AddNewContact] Failed while adding contact with error: {str(e)}")
            return self._make_return_json(500, {'message': str(e)})


    def _handle_removeContact(self, event):
        """
        Process a 'RemoveContact' request.
        Args:
            event: AWS API Gateway event given to the Lambda
        Returns:
            A dictionary object confirming success if the operation succeeds; 
            otherwise an error response with a message describing the request.
        """

        removeContactArgs = Translator.extract_removeContactArgs(event)

        print(f"[RemoveContact] Got request with args: {removeContactArgs}")

        try:
            self.db_accessor.remove_contact_for_user(removeContactArgs);
            print(f"[RemoveContact] Successfully removed contact")
            return self._make_return_json(200, {})
        except Exception as e:
            print(f"[RemoveContact] Failed while removing contact with error: {str(e)}")
            return self._make_return_json(500, {'message': str(e)})


    def _handle_updateContact(self, event):
        pass


    def _handle_getTagsForUser(self, event):
        pass


    def _handle_storeUserCredentials(self, event):
        pass


    def _handle_validateUserCredentials(self, event):
        pass


    def _handle_deleteUser(self, event):
        pass


    def _handle_getUserDetails(self, event):
        pass


