from aws.api_event_translator_util import ApiEventTranslatorUtil as translator
from aws import method_args
from datetime import datetime, date

def test_routeKey():
    event = {'version': '2.0', 'routeKey': 'POST /addContactForUser', 'rawPath': '/default/addContactForUser', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '241', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-680292fc-74beb12929f439b561dee925', 'x-forwarded-for': '71.183.30.4', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/addContactForUser', 'protocol': 'HTTP/1.1', 'sourceIp': '71.183.30.4', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'JOvnihwbiYcEJ0A=', 'routeKey': 'POST /addContactForUser', 'stage': 'default', 'time': '18/Apr/2025:17:59:24 +0000', 'timeEpoch': 1744999164613}, 'body': '{"user_token":"08d397ebc9414ce18bf31ecaad2c0cf8","newContact":{"fullname":"New test contact","location":"","userbio":"","metthrough":"","socials":[],"lastcontact":"2025-01-01T18:54:00.000Z","reminderPeriod":{"weeks":8,"months":0},"tags":[]}}', 'isBase64Encoded': False}

    result = translator.extract_routeKey(event)
    
    assert result['method'] == 'POST'
    assert result['path'] == '/addContactForUser'


def test_getContactByIdArgs():
    event = {'version': '2.0', 'routeKey': 'POST /getContactById/{id}', 'rawPath': '/default/getContactById/13', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '49', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-6802adc2-01dfdbf464db23683b4f2bd2', 'x-forwarded-for': '71.183.30.4', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/getContactById/13', 'protocol': 'HTTP/1.1', 'sourceIp': '71.183.30.4', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'JPAWcg26iYcEPkw=', 'routeKey': 'POST /getContactById/{id}', 'stage': 'default', 'time': '18/Apr/2025:19:53:38 +0000', 'timeEpoch': 1745006018498}, 'pathParameters': {'id': '13'}, 'body': '{"user_token":"08d397ebc9414ce18bf31ecaad2c0cf8"}', 'isBase64Encoded': False}

    print(event['pathParameters'])
    result = translator.extract_getContactByIdArgs(event)

    assert result['contact_id'] == 13
    assert result['user_token'] == '08d397ebc9414ce18bf31ecaad2c0cf8'


def test_searchContactsArgs():
    event = {'version': '2.0', 'routeKey': 'POST /searchContacts', 'rawPath': '/default/searchContacts', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '254', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-6802adb3-04530f52007d327b5e22c234', 'x-forwarded-for': '71.183.30.4', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/searchContacts', 'protocol': 'HTTP/1.1', 'sourceIp': '71.183.30.4', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'JPAUHg1KiYcEPQw=', 'routeKey': 'POST /searchContacts', 'stage': 'default', 'time': '18/Apr/2025:19:53:23 +0000', 'timeEpoch': 1745006003531}, 'body': '{"user_token":"08d397ebc9414ce18bf31ecaad2c0cf8","search_params":{"query_string":"","order_by":"Distance","tags":["work", "friend"],"lower_bound_date":"1970-01-01T00:00:00.000Z","upper_bound_date":"2025-04-18T19:53:22.744Z","user_lat":37.4220936,"user_lon":-122.083922}}', 'isBase64Encoded': False}

    result = translator.extract_searchContactsArgs(event)

    assert result['user_token'] == '08d397ebc9414ce18bf31ecaad2c0cf8'
    assert result['query_string'] == ''
    assert result['order_by'] == 'Distance'
    assert result['tags'] == ["work", "friend"]
    assert result['lower_bound_date'] == datetime.strptime("1970-01-01", "%Y-%M-%d").date()
    assert result['upper_bound_date'] == datetime.strptime("2025-04-18", "%Y-%M-%d").date()
    assert result['user_latitude'] == 37.4220936
    assert result['user_longitude'] == -122.083922


def test_addNewContactArgs():
    event = {'version': '2.0', 'routeKey': 'POST /addContactForUser', 'rawPath': '/default/addContactForUser', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '241', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-680292fc-74beb12929f439b561dee925', 'x-forwarded-for': '71.183.30.4', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/addContactForUser', 'protocol': 'HTTP/1.1', 'sourceIp': '71.183.30.4', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'JOvnihwbiYcEJ0A=', 'routeKey': 'POST /addContactForUser', 'stage': 'default', 'time': '18/Apr/2025:17:59:24 +0000', 'timeEpoch': 1744999164613}, 'body': '{"user_token":"08d397ebc9414ce18bf31ecaad2c0cf8","newContact":{"fullname":"New test contact","location":"Boston, MA","userbio":"sample bio","metthrough":"sample met through","socials":[{"address": "@testguy", "label": "insta"}, {"address": "tester", "label": "linkedin"}],"lastcontact":"2025-01-01T18:54:00.000Z","reminderPeriod":{"weeks":8,"months":0},"tags":["tag1"]}}', 'isBase64Encoded': False}

    result = translator.extract_addNewContactArgs(event)

    assert result['user_token'] == '08d397ebc9414ce18bf31ecaad2c0cf8'
    assert result['fullname'] == 'New test contact'
    assert result['location'] == 'Boston, MA'
    assert result['user_bio'] == 'sample bio'
    assert result['met_through'] == 'sample met through'
    assert result['socials'] == [{"address": "@testguy", "label": "insta"}, {"address": "tester", "label": "linkedin"}]
    assert result['last_contact'] == datetime.strptime("2025-01-01", "%Y-%M-%d").date()
    assert result['tags'] == ["tag1"]


def test_removeContactArgs():
    event = {'version': '2.0', 'routeKey': 'POST /removeContactForUser', 'rawPath': '/default/removeContactForUser', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '66', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-6802b5f4-342032790d6be5a34d247b03', 'x-forwarded-for': '71.183.30.4', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/removeContactForUser', 'protocol': 'HTTP/1.1', 'sourceIp': '71.183.30.4', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'JPFeVgf0iYcEMiQ=', 'routeKey': 'POST /removeContactForUser', 'stage': 'default', 'time': '18/Apr/2025:20:28:36 +0000', 'timeEpoch': 1745008116925}, 'body': '{"user_token":"08d397ebc9414ce18bf31ecaad2c0cf8","contactId":"17"}', 'isBase64Encoded': False}

    result = translator.extract_removeContactArgs(event)

    assert result['user_token'] == '08d397ebc9414ce18bf31ecaad2c0cf8'
    assert result['contact_id'] == 17


def test_updateContactArgs():
    event = {'version': '2.0', 'routeKey': 'POST /updateContactForUser', 'rawPath': '/default/updateContactForUser', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '274', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-6802b650-206ca4267db1f42e179d9e4c', 'x-forwarded-for': '71.183.30.4', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/updateContactForUser', 'protocol': 'HTTP/1.1', 'sourceIp': '71.183.30.4', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'JPFsqgzvCYcEM_Q=', 'routeKey': 'POST /updateContactForUser', 'stage': 'default', 'time': '18/Apr/2025:20:30:08 +0000', 'timeEpoch': 1745008208666}, 'body': '{"user_token":"08d397ebc9414ce18bf31ecaad2c0cf8","newContact":{"contact_id":"16","fullname":"New test contact","location":"Boston, MA","userbio":"sample bio","metthrough":"sample met through","socials":[{"address": "@testguy", "label": "insta"}, {"address": "tester", "label": "linkedin"}],"lastcontact":"2025-01-01T18:54:00.000Z","reminderPeriod":{"weeks":8,"months":0},"tags":["tag1"]}}', 'isBase64Encoded': False}

    result = translator.extract_updateContactArgs(event)

    assert result['user_token'] == '08d397ebc9414ce18bf31ecaad2c0cf8'
    assert result['fullname'] == 'New test contact'
    assert result['location'] == 'Boston, MA'
    assert result['user_bio'] == 'sample bio'
    assert result['met_through'] == 'sample met through'
    assert result['socials'] == [{"address": "@testguy", "label": "insta"}, {"address": "tester", "label": "linkedin"}]
    assert result['last_contact'] == datetime.strptime("2025-01-01", "%Y-%M-%d").date()
    assert result['tags'] == ["tag1"]


def test_getTagsForUserARgs():
    event = {'version': '2.0', 'routeKey': 'POST /getTagsForUser', 'rawPath': '/default/getTagsForUser', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '49', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-6802b5f8-338cd369018bc1882feec714', 'x-forwarded-for': '71.183.30.4', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/getTagsForUser', 'protocol': 'HTTP/1.1', 'sourceIp': '71.183.30.4', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'JPFe2jKkCYcEMhQ=', 'routeKey': 'POST /getTagsForUser', 'stage': 'default', 'time': '18/Apr/2025:20:28:40 +0000', 'timeEpoch': 1745008120266}, 'body': '{"user_token":"08d397ebc9414ce18bf31ecaad2c0cf8"}', 'isBase64Encoded': False}

    result = translator.extract_getTagsForUserArgs(event)

    assert result['user_token'] == "08d397ebc9414ce18bf31ecaad2c0cf8"


def test_storeUserCredentialsArgs():
    event = {'version': '2.0', 'routeKey': 'POST /storeUserCredentials', 'rawPath': '/default/storeUserCredentials', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '33', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-677f40f1-629a2298442e97921ca9e9e5', 'x-forwarded-for': '47.230.19.29', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/storeUserCredentials', 'protocol': 'HTTP/1.1', 'sourceIp': '47.230.19.29', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'EGcVxjZjiYcEJug=', 'routeKey': 'POST /storeUserCredentials', 'stage': 'default', 'time': '09/Jan/2025:03:22:25 +0000', 'timeEpoch': 1736392945321}, 'body': '{"username":"New","password":"Pwd"}', 'isBase64Encoded': False}

    result = translator.extract_storeUserCredentialsArgs(event)

    assert result['username'] == "New"
    assert result['password'] == "Pwd"


def test_validateUserCredentialsArgs():
    event = {'version': '2.0', 'routeKey': 'POST /validateUserCredentials', 'rawPath': '/default/validateUserCredentials', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '36', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-680288f7-32f120016bd5d5e24ca331d1', 'x-forwarded-for': '71.183.30.4', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/validateUserCredentials', 'protocol': 'HTTP/1.1', 'sourceIp': '71.183.30.4', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'JOpWwg84iYcEJkA=', 'routeKey': 'POST /validateUserCredentials', 'stage': 'default', 'time': '18/Apr/2025:17:16:39 +0000', 'timeEpoch': 1744996599684}, 'body': '{"username":"New","password":"Pwd"}', 'isBase64Encoded': False}

    result = translator.extract_validateUserCredentialsArgs(event)

    assert result['username'] == "New"
    assert result['password'] == "Pwd"


def test_deleteUserArgs():
    event = {'version': '2.0', 'routeKey': 'POST /deleteUser', 'rawPath': '/default/deleteUser', 'rawQueryString': '', 'headers': {'accept': '*/*', 'content-length': '51', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'curl/7.81.0', 'x-amzn-trace-id': 'Root=1-67716e86-64b4affe7a49116609447a50', 'x-forwarded-for': '47.230.19.29', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/deleteUser', 'protocol': 'HTTP/1.1', 'sourceIp': '47.230.19.29', 'userAgent': 'curl/7.81.0'}, 'requestId': 'Dj41GgYsCYcEMkw=', 'routeKey': 'POST /deleteUser', 'stage': 'default', 'time': '29/Dec/2024:15:45:10 +0000', 'timeEpoch': 1735487110612}, 'body': '{ "userToken": "e817fb7b884940fc856b5112970a0fbb" }', 'isBase64Encoded': False}

    result = translator.extract_deleteUserArgs(event)

    assert result['user_token'] == "e817fb7b884940fc856b5112970a0fbb"

    
def test_getUserDetailsArgs():
    event = {'version': '2.0', 'routeKey': 'POST /getUserDetails', 'rawPath': '/default/getUserDetails', 'rawQueryString': '', 'headers': {'accept': 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'content-length': '49', 'content-type': 'application/json', 'host': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'user-agent': 'okhttp/4.12.0', 'x-amzn-trace-id': 'Root=1-680288ed-477d80353e1e269877e3d564', 'x-forwarded-for': '71.183.30.4', 'x-forwarded-port': '443', 'x-forwarded-proto': 'https'}, 'requestContext': {'accountId': '711387105820', 'apiId': 'x8bhwx3sva', 'domainName': 'x8bhwx3sva.execute-api.us-east-2.amazonaws.com', 'domainPrefix': 'x8bhwx3sva', 'http': {'method': 'POST', 'path': '/default/getUserDetails', 'protocol': 'HTTP/1.1', 'sourceIp': '71.183.30.4', 'userAgent': 'okhttp/4.12.0'}, 'requestId': 'JOpVHhvYCYcEJCw=', 'routeKey': 'POST /getUserDetails', 'stage': 'default', 'time': '18/Apr/2025:17:16:29 +0000', 'timeEpoch': 1744996589114}, 'body': '{"user_token":"8dc9ff3699754dbc97d294c27a8b9a21"}', 'isBase64Encoded': False}

    result = translator.extract_getUserDetailsArgs(event)

    assert result['user_token'] == '8dc9ff3699754dbc97d294c27a8b9a21'