import requests
from flask import Blueprint, jsonify, request
from datetime import datetime
from openai import OpenAI
import logging

from app.db import accessor as db_accessor
from app.config import Config

logger = logging.getLogger(__name__)


contacts_bp = Blueprint("contacts", __name__)


def _location_to_coords(location: str) -> dict[str, str] | None:
    """
    Get the coordinates of a given location.
    Args:
        location: an address or name of a place as a string
    Returns:
        A dict in the form {'lat': num, 'lng': num} representing the 
            coordinates of the given location if it can be determined, 
            othewise return 'None'
    """

    logger.debug(f"Getting coordinates for location: {location}")

    if len(location) == 0:
        return None

    location_url_segment = '+'.join(location.split(' '))
    geocode_request_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={location_url_segment}&key={Config.GOOGLE_API_KEY}"
    geocode_response = requests.get(geocode_request_url)
    
    geocode_response.raise_for_status()
    location_coords = geocode_response.json()["results"][0]["geometry"]["location"]
    logger.debug(f"Parsed location coordinates: {location_coords}")

    return location_coords

def _get_contact_embedding(location: str, bio: str) -> list[float]:
    """
    Get the embedding of the given contact fields.
    Args:
        location: an address or name of a place as a string
        bio: user-specified description of the contact as a string
    Returns:
        A 1536-dimensional list representing the embedding of the fields
    """

    embedding_text = f"location='{location}'; bio='{bio}'"

    openai_client = OpenAI(api_key=Config.OPENAI_API_KEY)
    embedding_object = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=embedding_text,
        encoding_format="float"
    )

    return embedding_object.data[0].embedding


def _get_query_string_embedding(query_string: str,) -> list[float]:
    """
    Get the embedding of the given query string.
    Args:
        query_string: user-specified query to semantically search contacts 
    Returns:
        A 1536-dimensional list representing the embedding of the input
    """
    
    openai_client = OpenAI(api_key=Config.OPENAI_API_KEY)
    embedding_object = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=query_string,
        encoding_format="float"
    )

    return embedding_object.data[0].embedding


@contacts_bp.route("/getContactById", methods=["POST"])
def get_contact_by_id():
    logger.debug("Received get contact by ID request")

    data = request.get_json()
    user_token = data["user_token"]
    contact_id = int(data["contact_id"])

    logger.debug(f"Processing request - user_token: {user_token}, contact_id: {contact_id}")

    contact = db_accessor.get_contact_by_id(user_token, contact_id)
    logger.debug(f"Retrieved contact: {contact}")
    return jsonify(contact)


@contacts_bp.route("/addContactForUser", methods=["POST"])
def add_new_contact():
    logger.debug("Received add contact request")
    data = request.get_json()
    newcontact = data["newContact"]

    user_token: str = data['user_token']
    fullname: str = newcontact['fullname']
    location: str = newcontact['location']
    userbio: str = newcontact['userbio']
    metthrough: str = newcontact['metthrough']
    socials: list[dict] = newcontact['socials']

    lastcontact_str  = newcontact['lastcontact'].split('T')[0]
    lastcontact = datetime.strptime(lastcontact_str, "%Y-%M-%d").date()
    
    tags: list[str] = newcontact['tags']
    reminder_period_weeks: int = int(newcontact['reminderPeriod']['weeks'])
    reminder_period_months: int = int(newcontact['reminderPeriod']['months'])
    image_object_key: str = newcontact.get('image_object_key', '')

    coordinate = None
    if location:
        coordinate = _location_to_coords(location)
    
    embedding_vector = _get_contact_embedding(location, userbio)

    new_contact_id = db_accessor.add_contact(
        user_token=user_token,
        fullname=fullname,
        location=location,
        coordinate=coordinate,
        met_through=metthrough,
        user_bio=userbio,
        last_contact=lastcontact,
        reminder_period_weeks=reminder_period_weeks,
        reminder_period_months=reminder_period_months,
        embedding_vector=embedding_vector,
        socials=socials,
        tags=tags,
        image_object_key=image_object_key
    )

    return jsonify(new_contact_id)


@contacts_bp.route("/removeContactForUser", methods=["POST"])
def remove_contact():
    logger.debug("Received remove contact request")

    data = request.get_json()
    user_token = data["user_token"]
    contact_id = int(data["contact_id"])

    logger.debug(f"Processing remove request - user_token: {user_token}, contact_id: {contact_id}")

    db_accessor.delete_contact(user_token, contact_id)

    return jsonify({})


@contacts_bp.route("/updateContactForUser", methods=["POST"])
def update_contact():
    logger.debug("Received update contact request")

    data = request.get_json()
    newcontact = data["newContact"]

    user_token: str = data['user_token']

    contact_id: int = int(newcontact["contact_id"])
    fullname: str = newcontact['fullname']
    location: str = newcontact['location']
    userbio: str = newcontact['userbio']
    metthrough: str = newcontact['metthrough']
    socials: list[dict] = newcontact['socials']

    lastcontact_str  = newcontact['lastcontact'].split('T')[0]
    lastcontact = datetime.strptime(lastcontact_str, "%Y-%M-%d").date()
    
    tags: list[str] = newcontact['tags']
    reminder_period_weeks: int = int(newcontact['reminderPeriod']['weeks'])
    reminder_period_months: int = int(newcontact['reminderPeriod']['months'])
    image_object_key: str = newcontact.get('image_object_key', '')

    coordinate = None
    if location:
        coordinate = _location_to_coords(location)
    
    embedding_vector = _get_contact_embedding(location, userbio)

    new_contact_id = db_accessor.update_contact(
        user_token=user_token,
        contact_id=contact_id,
        fullname=fullname,
        location=location,
        coordinate=coordinate,
        met_through=metthrough,
        user_bio=userbio,
        last_contact=lastcontact,
        reminder_period_weeks=reminder_period_weeks,
        reminder_period_months=reminder_period_months,
        embedding_vector=embedding_vector,
        socials=socials,
        tags=tags,
        image_object_key=image_object_key
    )

    return jsonify(new_contact_id)


@contacts_bp.route("/searchContacts", methods=["POST"])
def search_contacts():
    logger.debug("Received search contacts request")

    data = request.get_json()
    user_token: str = data['user_token']
    search_params: dict = data['search_params']

    query_string: str = search_params['query_string']
    order_by: str     = search_params['order_by']
    tags: list[str]   = search_params['tags']

    lower_bound_date_str  = search_params['lower_bound_date'].split('T')[0]
    upper_bound_date_str  = search_params['upper_bound_date'].split('T')[0]

    lower_bound_date = datetime.strptime(lower_bound_date_str, "%Y-%m-%d").date()
    upper_bound_date = datetime.strptime(upper_bound_date_str, "%Y-%m-%d").date()
    
    user_lat = search_params['user_lat'] if 'user_lat' in search_params else None
    user_lon = search_params['user_lon'] if 'user_lon' in search_params else None

    if order_by == 'Relevance' and len(query_string) > 0:
        embedding_vector = _get_query_string_embedding(query_string)
        logger.debug("Generated embedding vector for search query")
    else:
        embedding_vector = None
        logger.debug("No embedding vector generated for search query")

    contacts = db_accessor.search_contacts_and_sort(
        user_token=user_token,
        query_string=query_string,
        embedding_string=embedding_vector,
        sort_option=order_by,
        tags=tags,
        lower_bound_date=lower_bound_date,
        upper_bound_date=upper_bound_date,
        user_latitude=user_lat,
        user_longitude=user_lon
    )

    return jsonify(contacts)
