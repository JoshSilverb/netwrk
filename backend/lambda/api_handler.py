"""api_handler.py"""

"""Processor for requests coming in from API Gateway"""

import json
import boto3
import requests
from botocore.exceptions import ClientError
from openai import OpenAI


import db_accessor
import login_manager

from get_secret import get_db_secret

#=============================================================================
#                              Contact accessors
#=============================================================================

def get_contacts_for_user(event, context):
    print("Got 'getContactsForUser POST Request - event:\n", event)

    data = json.loads(event['body'])
    user_token = data['user_token']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    try:
        contacts = db_accessor.get_contacts_for_user(user_token, config)

        return {
            'statusCode': 200,
            'body': json.dumps(contacts)
        }
    
    except Exception as e:
        print("Failed with message", str(e))

        return {
            'statusCode': 500,
            'body': str(e)
        }


def get_contact_by_id(event, context):
    print("Got 'removeContactsForUser GET Request - event:\n", event)

    data = json.loads(event['body'])
    user_token = data['user_token']
    contact_id = event['pathParameters']['id']

    DB_SECRETS = get_db_secret()
    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    try:
        contact = db_accessor.get_contact_by_id(user_token, contact_id, config)

        return {
            'statusCode': 200,
            'body': json.dumps(contact)
        }
    except Exception as e:
        print("Failed with message", str(e))

        return {
            'statusCode': 500,
            'body': str(e)
        }


def search_contacts(event, context):
    print("Got 'search contacts request - event:\n", event)

    data = json.loads(event['body'])
    user_token = data['user_token']
    search_params = data['search_params']

    if not search_params:
        return {
            'statusCode': 400,
            'body': 'No search params given'
        }        

    DB_SECRETS = get_db_secret()
    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

     # Create a Secrets Manager client
    openai_api_secret_name = "openai-api-key"
    region_name = "us-east-2"
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    print("Created secret session client")

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=openai_api_secret_name
        )
        secret_string = get_secret_value_response['SecretString']
        openai_api_key = json.loads(secret_string)['api-key']
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': str(e)
        }
    
    client = OpenAI(api_key=openai_api_key)

    try:
        contacts = db_accessor.search_contacts(user_token, search_params, client, config)

        return {
            'statusCode': 200,
            'body': json.dumps(contacts)
        }
    except Exception as e:
        print("Failed with message", str(e))

        return {
            'statusCode': 500,
            'body': str(e)
        }


#=============================================================================
#                              Contact manipulators
#=============================================================================


def add_contact_for_user(event, context):
    print("Got 'addContactsForUser POST Request - event:\n", event)

    data = json.loads(event['body'])
    user_token = data['user_token']
    new_contact = data['newContact']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    print("Generated config")
    
    location_coords = None

    google_api_secret_name = "google-api-key-1"
    openai_api_secret_name = "openai-api-key"
    region_name = "us-east-2"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    print("Created secret session client")

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=google_api_secret_name
        )
        secret_string = get_secret_value_response['SecretString']
        google_api_key = json.loads(secret_string)['api-key']

        get_secret_value_response = client.get_secret_value(
            SecretId=openai_api_secret_name
        )
        secret_string = get_secret_value_response['SecretString']
        openai_api_key = json.loads(secret_string)['api-key']
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': str(e)
        }

    print("Successfully loaded secrets")
    
    if "location" in new_contact and new_contact['location'] != "":
        print("Entering coordinate fetching block")

        location_url_segment = '+'.join(new_contact["location"].split(' '))
        geocode_request_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={location_url_segment}&key={google_api_key}"
        print("Geocode request url:", geocode_request_url)
        geocode_response = requests.get(geocode_request_url)
        print("Got geocode response:", geocode_response.json())
        
        geocode_response.raise_for_status()
        location_coords = geocode_response.json()["results"][0]["geometry"]["location"]
        print("Parsed location coords:", location_coords)
    
    # Embedding block
    embedding_text = f"location='{new_contact['location']}'; bio='{new_contact['userbio']}'"


    client = OpenAI(api_key=openai_api_key)
    embedding_object = client.embeddings.create(
        model="text-embedding-3-small",
        input=embedding_text,
        encoding_format="float"
    )

    embedding_vector = embedding_object.data[0].embedding

    try:
        new_contact_id = db_accessor.add_contact_for_user(user_token, new_contact, location_coords, embedding_vector, config)

        return {
            'statusCode': 200,
            'body': json.dumps(new_contact_id)
        }
    
    except Exception as e:    
        print("Failed with message", str(e))

        return {
            'statusCode': 500,
            'body': str(e)
        }


def remove_contact_for_user(event, context):
    print("Got 'removeContactsForUser POST Request - event:\n", event)
    
    data = json.loads(event['body'])
    user_token = data['user_token']
    contact_id = data['contactId']

    DB_SECRETS = get_db_secret()
    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    try:
        db_accessor.remove_contact_for_user(user_token, contact_id, config)
        
        return {
            'statusCode': 200
        }
    
    except Exception as e:
        print("Failed with message", str(e))

        return {
            'statusCode': 500,
            'body': str(e)
        }


def update_contact_for_user(event, context):
    print("Got 'updateContactForUser POST Request - event:\n", event)

    data = json.loads(event['body'])
    user_token = data['user_token']
    new_contact = data['newContact']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    print("Generated config")

    location_coords = None

    google_api_secret_name = "google-api-key-1"
    openai_api_secret_name = "openai-api-key"
    region_name = "us-east-2"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    print("Created secret session client")

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=google_api_secret_name
        )
        secret_string = get_secret_value_response['SecretString']
        google_api_key = json.loads(secret_string)['api-key']

        get_secret_value_response = client.get_secret_value(
            SecretId=openai_api_secret_name
        )
        secret_string = get_secret_value_response['SecretString']
        openai_api_key = json.loads(secret_string)['api-key']
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': str(e)
        }

    print("Successfully loaded secrets")
    
    if "location" in new_contact and new_contact['location'] != "":
        print("Entering coordinate fetching block")

        location_url_segment = '+'.join(new_contact["location"].split(' '))
        geocode_request_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={location_url_segment}&key={google_api_key}"
        print("Geocode request url:", geocode_request_url)
        geocode_response = requests.get(geocode_request_url)
        print("Got geocode response:", geocode_response.json())
        
        geocode_response.raise_for_status()
        location_coords = geocode_response.json()["results"][0]["geometry"]["location"]
        print("Parsed location coords:", location_coords)
    
    # Embedding block
    embedding_text = f"location='{new_contact['location']}'; bio='{new_contact['userbio']}'"


    client = OpenAI(api_key=openai_api_key)
    embedding_object = client.embeddings.create(
        model="text-embedding-3-small",
        input=embedding_text,
        encoding_format="float"
    )

    embedding_vector = embedding_object.data[0].embedding

    try:
        contact_id = db_accessor.update_contact_for_user(user_token, new_contact, location_coords, embedding_vector, config)

        return {
            'statusCode': 200,
            'body': json.dumps(contact_id)
        }
    
    except Exception as e:
        print("Failed with message", str(e))

        return {
            'statusCode': 500,
            'body': str(e)
        }


def get_tags_for_user(event, context):
    print("Got 'getTagsForUser POST Request - event:\n", event)

    data = json.loads(event['body'])
    user_token = data['user_token']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    try:
        tags = db_accessor.get_tags_for_user(user_token, config)

        return {
            'statusCode': 200,
            'body': json.dumps(tags)
        }
    
    except Exception as e:
        print("Failed with message", str(e))

        return {
            'statusCode': 500,
            'body': str(e)
        }

#=============================================================================
#                        User profile manipulators
#=============================================================================

def store_user_credentials(event, context):
    print("Got 'storeUserCredentials POST Request - event:\n", event)
    
    data = json.loads(event['body'])
    username = data['username']
    password = data['password']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    try:
        user_token = login_manager.store_user_credentials(username, password, config)
    except Exception  as e:
        print("storeUserCredentials failed with exception:", e)

        return {
            'statusCode': 500,
            'body': {
                'errorMessage': str(e)
            }
        }
    
    returnObject = {
        'user_token': user_token
    }

    return {
        'statusCode': 200,
        'body': json.dumps(returnObject)
    }


def validate_user_credentials(event, context):
    print("Got 'validateUserCredentials POST Request - event:\n", event)
    
    data = json.loads(event['body'])
    username = data['username']
    password = data['password']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    try:
        user_token = login_manager.validate_user_credentials(username, password, config)
    except Exception  as e:
        print("validateUserCredentials failed with exception:", e)

        return {
            'statusCode': 500,
            'body': {
                'errorMessage': str(e)
            }
        }
    
    returnObject = {
        'user_token': user_token
    }

    return {
        'statusCode': 200,
        'body': json.dumps(returnObject)
    }


def delete_user(event, context):
    print("Got 'deleteUser POST Request - event:\n", event)
    
    data = json.loads(event['body'])
    user_token = data['user_token']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    try:
        user_token = login_manager.delete_user(user_token, config)
    except Exception  as e:
        print("deleteUser failed with exception:", e)

        return {
            'statusCode': 500,
            'body': {
                'errorMessage': str(e)
            }
        }
    
    return {
        'statusCode': 200
    }


def get_user_details(event, context):
    print("Got get user details POST Request - event:\n", event)
    
    data = json.loads(event['body'])
    user_token = data['user_token']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    try:
        user_details = login_manager.get_user_details(user_token, config)

        return {
            'statusCode': 200,
            'body': json.dumps(user_details)
        }
    except Exception  as e:
        print("getUserDetails failed with exception:", e)

        return {
            'statusCode': 500,
            'body': {
                'errorMessage': str(e)
            }
        }
    
    