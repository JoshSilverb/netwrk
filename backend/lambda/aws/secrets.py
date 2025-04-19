# Use this code snippet in your app.
# If you need more information about configurations
# or implementing the sample code, visit the AWS docs:
# https://aws.amazon.com/developer/language/python/

import boto3
import json
from botocore.exceptions import ClientError


def get_secrets_client() -> boto3.session.client:
    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name="us-east-2"
    )

    return client


def get_db_secret(client: boto3.session.client | None):

    if client is None:
        client = get_secrets_client()

    secret_name = "netwrkdb-pwd-1"

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        # For a list of exceptions thrown, see
        # https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        raise e

    secret = get_secret_value_response['SecretString']

    return json.loads(secret)


def get_google_api_secret(client: boto3.session.client | None):

    if client is None:
        client = get_secrets_client()

    secret_name = "google-api-key-1"

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        # For a list of exceptions thrown, see
        # https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        raise e

    secret = get_secret_value_response['SecretString']
    api_key = json.loads(secret)['api-key']

    return api_key


def get_openai_api_secret(client: boto3.session.client | None):

    if client is None:
        client = get_secrets_client()

    secret_name = "openai-api-key"

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        # For a list of exceptions thrown, see
        # https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        raise e

    secret = get_secret_value_response['SecretString']
    api_key = json.loads(secret)['api-key']

    return api_key