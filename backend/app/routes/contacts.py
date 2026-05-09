import requests
from flask import Blueprint, jsonify, request
from datetime import datetime
from openai import OpenAI
import logging

from app.db import accessor as db_accessor
from app.config import Config
from app.aws import awsutils

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
            otherwise return 'None'
    """

    logger.info(f"Getting coordinates for location: {location}")

    if len(location) == 0:
        return None

    location_url_segment = '+'.join(location.split(' '))
    geocode_request_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={location_url_segment}&key={Config.GOOGLE_API_KEY}"
    geocode_response = requests.get(geocode_request_url)

    geocode_response.raise_for_status()
    location_coords = geocode_response.json()["results"][0]["geometry"]["location"]
    logger.info(f"Parsed location coordinates: {location_coords}")

    return location_coords

def _get_contact_embedding(name: str,
                           location: str,
                           met_through:str,
                           bio: str) -> list[float]:
    """
    Get the embedding for a contact with the given attributes.
    Args:
        name: the name of the contact
        location: the location of the contact
        met_through: how the user met the contact
        bio: user-specified description of the contact
    Returns:
        A 1536-dimensional list representing the embedding of the fields
    """

    embedding_text = f"met_through='{met_through}'; location='{location}'; bio='{bio}; name='{name}'"

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


def _generate_contact_profile_pic_url(profile_pic_object_name: str) -> str:
    """
    Generate a signed S3 URL for a contact's profile picture.
    Args:
        profile_pic_object_name: S3 object key for the profile picture
    Returns:
        Signed S3 URL string, or empty string if generation fails
    """
    if not profile_pic_object_name:
        return ""

    try:
        profile_pic_url = awsutils.getSignedS3ObjectURL(
            profile_pic_object_name,
            awsutils.S3ObjectMethods.DOWNLOAD
        )
        return profile_pic_url or ""
    except Exception as e:
        logger.error(f"Failed to get signed URL for contact profile picture {profile_pic_object_name}: {e}")
        return ""


@contacts_bp.route("/getContactById", methods=["POST"])
def get_contact_by_id():
    data = request.get_json()
    logger.info(f"Received get contact by ID request with data: {data}")

    user_token = data["user_token"]
    contact_id = int(data["contact_id"])

    contact = db_accessor.get_contact_by_id(user_token, contact_id)
    logger.info(f"Retrieved contact: {contact}")

    if not contact:
        return jsonify(contact)

    # Contact's own profile pic
    if contact.get("profile_pic_object_name"):
        contact["profile_pic_url"] = _generate_contact_profile_pic_url(contact["profile_pic_object_name"])
    else:
        contact["profile_pic_url"] = ""

    # Linked user's profile pic
    linked_pic_key = contact.pop("linked_user_profile_pic_object_name", None)
    contact["linked_user_profile_pic_url"] = _generate_contact_profile_pic_url(linked_pic_key or "")

    return jsonify(contact)


@contacts_bp.route("/addContactForUser", methods=["POST"])
def add_new_contact():
    data = request.get_json()
    logger.info(f"Received add contact request with data: {data}")

    newcontact = data["newContact"]

    user_token: str               = data['user_token']
    fullname: str                 = newcontact['fullname']
    location: str                 = newcontact.get('location', '')
    userbio: str                  = newcontact.get('userbio', '')
    metthrough: str               = newcontact.get('metthrough', '')
    socials: list[dict]           = newcontact.get('socials', [])
    tags: list[str]               = newcontact.get('tags', [])
    linked_user_id: str | None    = newcontact.get('linked_user_id')
    image_object_key: str         = newcontact.get('image_object_key', '')

    lastcontact_str = newcontact.get('lastcontact') or datetime.today().strftime("%Y-%m-%d")
    lastcontact = datetime.strptime(lastcontact_str, "%Y-%m-%d").date()

    reminder_period_weeks: int | None  = newcontact.get('reminderPeriod', {}).get('weeks')
    reminder_period_months: int | None = newcontact.get('reminderPeriod', {}).get('months')

    if linked_user_id:
        # For linked contacts, location and bio come from the linked user at read time
        coordinate = None
        embedding_vector = _get_contact_embedding(fullname, "", metthrough, "")
    else:
        coordinate = _location_to_coords(location) if location else None
        embedding_vector = _get_contact_embedding(fullname, location, metthrough, userbio)

    try:
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
            image_object_key=image_object_key,
            linked_user_id=linked_user_id
        )
    except ValueError as e:
        if "DUPLICATE_LINKED_USER" in str(e):
            return jsonify({"error": "You have already added this user as a contact"}), 409
        raise

    return jsonify(new_contact_id)


@contacts_bp.route("/removeContactForUser", methods=["POST"])
def remove_contact():
    data = request.get_json()
    logger.info(f"Received remove contact request with data: {data}")

    user_token = data["user_token"]
    contact_id = int(data["contact_id"])

    db_accessor.delete_contact(user_token, contact_id)

    return jsonify({})


@contacts_bp.route("/updateContactForUser", methods=["POST"])
def update_contact():
    data = request.get_json()
    logger.info(f"Received update contact request with data: {data}")

    newcontact = data["newContact"]

    user_token: str = data['user_token']
    contact_id: int = int(newcontact["contact_id"])
    fullname: str   = newcontact['fullname']
    userbio: str    = newcontact['userbio']
    metthrough: str = newcontact['metthrough']
    socials: list[dict] = newcontact['socials']
    tags: list[str]     = newcontact['tags']

    lastcontact_str = newcontact['lastcontact']
    lastcontact = datetime.strptime(lastcontact_str, "%Y-%m-%d").date()

    reminder_period_weeks: int | None  = newcontact['reminderPeriod']['weeks']
    reminder_period_months: int | None = newcontact['reminderPeriod']['months']

    # Fetch existing contact to check is_linked
    existing = db_accessor.get_contact_by_id(user_token, contact_id)
    if not existing:
        return jsonify({"error": "Contact not found"}), 404

    is_linked = existing.get("is_linked", False)

    if is_linked:
        # Locked fields — ignore incoming values, preserve stored ones
        location = existing.get("location") or ""
        image_object_key = ""
        coordinate = None
        # Embedding uses only the non-locked fields
        embedding_vector = _get_contact_embedding(fullname, "", metthrough, userbio)
    else:
        location: str        = newcontact['location']
        image_object_key: str = newcontact.get('image_object_key', '')
        coordinate = _location_to_coords(location) if location else None
        embedding_vector = _get_contact_embedding(fullname, location, metthrough, userbio)

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
    data = request.get_json()
    logger.info(f"Received search contacts request with data: {data}")

    user_token: str = data['user_token']
    search_params: dict = data['search_params']

    query_string: str = search_params['query_string']
    order_by: str     = search_params['order_by']
    tags: list[str]   = search_params['tags']

    # Dates are now sent as YYYY-MM-DD strings (timezone-agnostic)
    lower_bound_date_str = search_params['lower_bound_date']
    upper_bound_date_str = search_params['upper_bound_date']

    lower_bound_date = datetime.strptime(lower_bound_date_str, "%Y-%m-%d").date()
    upper_bound_date = datetime.strptime(upper_bound_date_str, "%Y-%m-%d").date()

    user_lat = search_params['user_lat'] if 'user_lat' in search_params else None
    user_lon = search_params['user_lon'] if 'user_lon' in search_params else None

    # Generate embedding for any query string (used for semantic filtering across all sort options)
    if len(query_string) > 0:
        embedding_vector = _get_query_string_embedding(query_string)
        logger.info("Generated embedding vector for search query")
    else:
        embedding_vector = None
        logger.info("No embedding vector generated - will return all contacts")

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

    for contact in contacts:
        if contact.get("profile_pic_object_name"):
            contact["profile_pic_url"] = _generate_contact_profile_pic_url(contact["profile_pic_object_name"])
        contact["is_linked"] = contact.get("linked_user_id") is not None
        linked_pic_key = contact.pop("linked_user_profile_pic_object_name", None)
        contact["linked_user_profile_pic_url"] = _generate_contact_profile_pic_url(linked_pic_key or "")

    return jsonify(contacts)
