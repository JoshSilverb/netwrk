from app.request_processor import RequestProcessor

def handle_request(event, context):
    requestProcessor = RequestProcessor()

    response = requestProcessor.route_request(event, context)

    return response
