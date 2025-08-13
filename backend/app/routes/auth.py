from flask import Blueprint, jsonify, request
from app.models.user import User
from app.db import accessor as db_accessor

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/validateUserCredentials", methods=["POST"])
def get_users():

    data = request.get_json()

    username: str = data['username']
    password: str = data['password']

    user_token = db_accessor.validate_user_credentials(username=username, password=password)
    
    return jsonify({"user_token": user_token})
