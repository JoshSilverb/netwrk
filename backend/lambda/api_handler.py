"""api_handler.py"""

"""Processor for requests coming in from API Gateway"""

import json

import db_accessor
import login_manager

from get_secret import get_db_secret

#=============================================================================
#                              Contact manipulators
#=============================================================================

def get_contacts_for_user(event, context):
    print("Got 'getContactsForUser GET Request - event:\n", event)

    username = "josh"

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    error_message, contacts = db_accessor.get_contacts_for_user(username, config)

    if not error_message:
        return {
            'statusCode': 200,
            'body': json.dumps(contacts)
        }
    
    print("Failed with message", error_message)

    return {
        'statusCode': 500,
        'body': error_message
    }


def add_contact_for_user(event, context):
    print("Got 'addContactsForUser POST Request - event:\n", event)

    data = json.loads(event['body'])
    username = data['creatorUsername']
    new_contact = data['newContact']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    status, result = db_accessor.add_contact_for_user(username, new_contact, config)
    
    if status:
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    
    print("Failed with message", result)

    return {
        'statusCode': 500,
        'body': result
    }


def remove_contact_for_user(event, context):
    print("Got 'removeContactsForUser POST Request - event:\n", event)
    
    data = json.loads(event['body'])
    username = data['creatorUsername']
    contact_id = data['contactId']

    DB_SECRETS = get_db_secret()
    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    status, result = db_accessor.remove_contact_for_user(username, contact_id, config)

    if status:
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    
    print("Failed with message", result)

    return {
        'statusCode': 500,
        'body': result
    }


def get_contact_by_id(event, contex):
    print("Got 'removeContactsForUser GET Request - event:\n", event)

    username = ""
    contact_id = event['pathParameters']['id']

    DB_SECRETS = get_db_secret()
    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    status, result = db_accessor.get_contact_by_id(username, contact_id, config)

    if status:
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    
    print("Failed with message", result)

    return {
        'statusCode': 500,
        'body': result
    }


def update_contact_for_user(event, context):
    print("Got 'updateContactForUser POST Request - event:\n", event)

    data = json.loads(event['body'])
    username = data['creatorUsername']
    new_contact = data['newContact']

    DB_SECRETS = get_db_secret()

    config = db_accessor.Db_config(DB_SECRETS["host"], "netwrkdb", DB_SECRETS["username"], DB_SECRETS["password"], DB_SECRETS["port"])

    status, result = db_accessor.update_contact_for_user(username, new_contact, config)
    
    if status:
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    
    print("Failed with message", result)

    return {
        'statusCode': 500,
        'body': result
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
    user_token = data['userToken']

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
