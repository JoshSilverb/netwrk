import json
from app.app import handle_request
from app.core.user import User
from app.core.contact import Contact
import psycopg2
import bcrypt


EMPTY_LAMBDA_CONTEXT = {}

def get_db():
    conn = psycopg2.connect(
        dbname="netwrkdb",
        user="postgres",
        password="postgres",  # assuming no security, as you said
        host="db",            # use service name defined in docker-compose
        port="5432"
    )
    conn.autocommit = True
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    return cursor


def populateLambdaEvent(stage: str, path: str, request_body: dict) -> str:
    # request_string = {'version': '2.0', 'routeKey': f'POST {path}', 'rawPath': f'{stage}{path}', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '38', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-68155eb7-73fa56870ad7b9986ed8f6a9', 'x-forwarded-for': '47.230.19.29', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': f'{stage}{path}', 'protocol': 'HTTP/1.1', 'sourceIp': '47.230.19.29', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'J9u8rhvIiYcEP8A=', 'routeKey': f'POST {path}', 'stage': 'default', 'time': '03/May/2025:00:09:27 +0000', 'timeEpoch': 1746230967143}, 'body': request_body, 'isBase64Encoded': False}
    return {'version': '2.0', 'routeKey': f'POST {path}', 'rawPath': f'{stage}{path}', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '38', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-68155eb7-73fa56870ad7b9986ed8f6a9', 'x-forwarded-for': '47.230.19.29', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': f'{stage}{path}', 'protocol': 'HTTP/1.1', 'sourceIp': '47.230.19.29', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'J9u8rhvIiYcEP8A=', 'routeKey': f'POST {path}', 'stage': 'default', 'time': '03/May/2025:00:09:27 +0000', 'timeEpoch': 1746230967143}, 'body': json.dumps(request_body), 'isBase64Encoded': False}
    # request_string = f"{{'version': '2.0', 'routeKey': 'POST {path}', 'rawPath': '{stage}{path}', 'rawQueryString': '', 'headers': {{'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '38', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-68155eb7-73fa56870ad7b9986ed8f6a9', 'x-forwarded-for': '47.230.19.29', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}}, 'requestContext': {{'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {{'method': 'POST', 'path': '{stage}{path}', 'protocol': 'HTTP/1.1', 'sourceIp': '47.230.19.29', 'userAgent': 'okhttp/4.12.0'}}, 'requestId': 'J9u8rhvIiYcEP8A=', 'routeKey': 'POST {path}', 'stage': 'default', 'time': '03/May/2025:00:09:27 +0000', 'timeEpoch': 1746230967143}}, 'body': '{json.dumps(request_body)}', 'isBase64Encoded': False}}"
    # return json.loads(request_string)


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


def createGetUserDetailsRequest(user_token: str):
    """
    Create a get user details request event in the style of an AWS lambda event.
    Args:
        user_token: the user token corresponding to the user whose details are being requested
    Returns:
        An AWS Lambda event corresponding to a get user details request
    """

    request = {'user_token': user_token}

    return populateLambdaEvent('default', '/getUserDetails', request)


def createDeleteUserRequest(user_token: str):
    """
    Create a delete user request event in the style of an AWS lambda event.
    Args:
        user_token: the user token corresponding to the user being deleted
    Returns:
        An AWS Lambda event corresponding to a delete user request
    """

    request = {'user_token': user_token}

    return populateLambdaEvent('default', '/deleteUser', request)


#======================================================================
#                           TESTS
#======================================================================

def test_user_creation(reset_db, mock_secrets):
    """
    GIVEN a user with a specific username and password and arbitrary 
        num_contacts,

    WHEN a request is made to create a user with these details,

    THEN a success response will be returned with a non-null user token, and 
        and entry will be added to the database for this user.
    """

    # GIVEN
    user = User('myuser', 'pwd', 0)

    # WHEN
    rq = createNewUserRequest(user)
    response = handle_request(rq, EMPTY_LAMBDA_CONTEXT)

    # THEN
    assert 'statusCode' in response and response['statusCode'] == 200
    assert 'body' in response
    responseData = json.loads(response['body'])
    assert 'user_token' in responseData and \
            responseData['user_token'] is not None

    cursor = get_db()
    cursor.execute("SELECT username, password, user_token, num_contacts FROM users;")
    users = cursor.fetchall()


    assert len(users) == 1
    retrievedUser = dict(users[0])

    assert retrievedUser['username'] == user.username
    assert bcrypt.checkpw(user.password.encode('utf-8'), retrievedUser['password'].encode('utf-8'))
    assert retrievedUser['user_token'].strip() == responseData['user_token']
    assert retrievedUser['num_contacts'] == 0


def test_get_user_details(reset_db, mock_secrets):
    """
    GIVEN a created user with a specific username and password,

    WHEN a request is made to get this user's details,

    THEN a success response will be returned with this user's username and \
        number of contacts.
    """

    # GIVEN
    user = User('myuser', 'pwd', 0)
    create_user_request = createNewUserRequest(user)
    create_user_response = handle_request(create_user_request, EMPTY_LAMBDA_CONTEXT)

    # WHEN
    user_token = json.loads(create_user_response['body'])['user_token']
    get_details_request = createGetUserDetailsRequest(user_token)
    get_details_response = handle_request(get_details_request, EMPTY_LAMBDA_CONTEXT)
    
    # THEN
    assert 'statusCode' in get_details_response and \
            get_details_response['statusCode'] == 200
    assert 'body' in get_details_response
    responseData = json.loads(get_details_response['body'])
    assert 'username' in responseData and \
                                    responseData['username'] == user.username
    assert 'num_contacts' in responseData and \
                                            responseData['num_contacts'] == 0


def test_delete_user(reset_db, mock_secrets):
    """
    GIVEN a created user with a specific username and password,

    WHEN a request is made to delete this user,

    THEN a success response will be returned with this user's username and \
        the database no longer contains this user.
    """

    # GIVEN
    user = User('myuser', 'pwd', 0)
    create_user_request = createNewUserRequest(user)
    create_user_response = handle_request(create_user_request, EMPTY_LAMBDA_CONTEXT)

    # WHEN
    user_token = json.loads(create_user_response['body'])['user_token']
    delete_user_request = createDeleteUserRequest(user_token)
    delete_user_response = handle_request(delete_user_request, EMPTY_LAMBDA_CONTEXT)
    
    # THEN
    assert 'statusCode' in delete_user_response and \
            delete_user_response['statusCode'] == 200
    assert 'body' in delete_user_response and delete_user_response['body'] == '{}'


# def test_create_contact(reset_db, mock_secrets):
#     """
#     GIVEN a created user and a contact,

#     WHEN a request is made to add this contact for this user,

#     THEN a success response will be returned with this contact's ID and the \
#         database will have a new row added reflecting this new contact.
#     """

#     # GIVEN
#     user = User('myuser', 'pwd', 0)
#     create_user_request = createNewUserRequest(user)
#     create_user_response = handle_request(create_user_request, EMPTY_LAMBDA_CONTEXT)

#     contact = Contact(fullname_='mycontact',
#                       location_='New York, NY, USA',
#                       met_through_='Met at a work event',
#                       user_bio_='Software engineer working in fintech',
#                       last_contact_=)
#     # WHEN
#     user_token = json.loads(create_user_response['body'])['user_token']
#     delete_user_request = createDeleteUserRequest(user_token)
#     delete_user_response = handle_request(delete_user_request, EMPTY_LAMBDA_CONTEXT)
    
#     # THEN
#     assert 'statusCode' in delete_user_response and \
#             delete_user_response['statusCode'] == 200
#     assert 'body' in delete_user_response and delete_user_response['body'] == '{}'

# To automatically format this project, run `black .`