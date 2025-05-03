""""""

import boto3
import json
from botocore.exceptions import ClientError


def get_db_secret():
    """
    Query AWS Secret Store for the secrets associated with the database
    Returns:
        A dictionary contianing "host", "username", "password", and "port" f
    """

    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name="us-east-2"
    )

    secret_name = "netwrkdb-pwd-1"

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        print(f"Failed to get DB secret with error: {str(e)}")
        raise e

    secret = get_secret_value_response['SecretString']

    return json.loads(secret)


def get_google_api_secret() -> str:
    """
    Query AWS Secret Store for the Google API key
    Returns:
        A string containing the retrieved Google API key
    """

    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name="us-east-2"
    )

    secret_name = "google-api-key-1"

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        print(f"Failed to get Google API secret with error: {str(e)}")
        raise e

    secret = get_secret_value_response['SecretString']
    api_key = json.loads(secret)['api-key']

    return api_key


def get_openai_api_secret():
    """
    Query AWS Secret Store for the OpenAI API key
    Returns:
        A string containing the retrieved OpenAI API key
    """

    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name="us-east-2"
    )

    secret_name = "openai-api-key"

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        print(f"Failed to get OpenAI API secret with error: {str(e)}")
        raise e

    secret = get_secret_value_response['SecretString']
    api_key = json.loads(secret)['api-key']

    return api_key