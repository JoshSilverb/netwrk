"""api_handler.py"""

"""Processor for requests coming in from API Gateway"""

import db_accessor
import json

from get_secret import get_db_secret

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