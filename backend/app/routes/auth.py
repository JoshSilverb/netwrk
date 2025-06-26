from flask import Blueprint, jsonify
from app.models.user import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/validateUserCredentials")
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name} for u in users])
