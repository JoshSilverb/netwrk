from flask import Blueprint, jsonify, request
from app.config import Config
import requests

import logging

logger = logging.getLogger(__name__)

utils_bp = Blueprint("utils", __name__)


@utils_bp.route("/places/autocomplete")
def places_autocomplete():

    input_text = request.args.get("input")
    session_token = request.args.get("sessiontoken")
    location = request.args.get("location")
    radius = request.args.get("radius")

    params = {
        "input": input_text,
        "key": Config.GOOGLE_API_KEY,
    }
    if session_token:
        params["sessiontoken"] = session_token
    if location:
        params["location"] = location
    if radius:
        params["radius"] = radius

    r = requests.get(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        params=params,
    )

    return jsonify(r.json())
