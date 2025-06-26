from flask import Blueprint, jsonify
from app.models.user import User

users_bp = Blueprint("users", __name__)

@users_bp.route("/deleteUser")
def delete_user():
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name} for u in users])


@users_bp.route("/getUserDetails")
def get_user_details():
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name} for u in users])


@users_bp.route("/storeUserCredentials")
def create_user():
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name} for u in users])


@users_bp.route("/getTagsForUser")
def get_tags_for_user():
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name} for u in users])

