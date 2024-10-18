"""api_handler.py"""

"""Processor for requests coming in from API Gateway"""

import db_accessor
import json

def get_contacts_for_user(event, context):
    print("Got 'getContactsForUser GET Request - event:\n", event)

    username = "josh"

    error_message, contacts = db_accessor.get_contacts_for_user(username)

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
    pass