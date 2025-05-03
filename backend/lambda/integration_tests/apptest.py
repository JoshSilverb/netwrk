import pytest
import json
from app.app import handle_request
from app.core.user import User


def populateLambdaEvent(stage: str, path: str, request_body: dict) -> str:
    return f"{{'version': '2.0', 'routeKey': 'POST {path}', 'rawPath': '{stage}{path}', 'rawQueryString': '', 'headers': {{'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '38', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-68155eb7-73fa56870ad7b9986ed8f6a9', 'x-forwarded-for': '47.230.19.29', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}}, 'requestContext': {{'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {{'method': 'POST', 'path': '{stage}{path}', 'protocol': 'HTTP/1.1', 'sourceIp': '47.230.19.29', 'userAgent': 'okhttp/4.12.0'}}, 'requestId': 'J9u8rhvIiYcEP8A=', 'routeKey': 'POST {path}', 'stage': 'default', 'time': '03/May/2025:00:09:27 +0000', 'timeEpoch': 1746230967143}}, 'body': '{json.dumps(request_body)}', 'isBase64Encoded': False}}"


def createNewUserRequest(user: User):
    """
    Create a new user request event in the style of an AWS lambda event.
    Args:
        user: a 'User' object describing the new user to create
    Returns:
        An AWS Lambda event corresponding to a new user request
    """

    request = {'username': user.username,'password': user.password}

    return populateLambdaEvent('default', '/storeUserCredentials', request)


def start_db():
    """
    start the db
    """
    pass

def stop_db():
    """
    stop and reset the db
    """
    pass


def test():
    """Fake test to show format for the other tests"""
    start_db()
    rq = createNewUserRequest('a', 'b', {'c':1})
    response = handle_request(rq)

    # check db with another call here?
    # users = dumpUserTable()
    # assert myUser in users

    stop_db()
