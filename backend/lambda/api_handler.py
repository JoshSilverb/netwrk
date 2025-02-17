"""api_handler.py"""

"""Processor for requests coming in from API Gateway"""

import json

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
        return get_contacts_for_user(event, context)

    DB_SECRETS = get_db_secret()
    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    try:
        contacts = db_accessor.search_contacts(user_token, 
                                              search_params, 
                                              config)

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

    try:
        new_contact_id = db_accessor.add_contact_for_user(user_token, new_contact, config)

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

    try:
        contact_id = db_accessor.update_contact_for_user(user_token, new_contact, config)

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
    
    