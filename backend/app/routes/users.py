from flask import Blueprint, jsonify, request
import logging

from app.db import accessor as db_accessor
from app.aws import awsutils

logger = logging.getLogger(__name__)


users_bp = Blueprint("users", __name__)


def _generate_user_profile_pic_url(profile_pic_object_name: str) -> str:
    if not profile_pic_object_name:
        return ""
    try:
        url = awsutils.getSignedS3ObjectURL(profile_pic_object_name, awsutils.S3ObjectMethods.DOWNLOAD)
        return url or ""
    except Exception as e:
        logger.error(f"Failed to get signed URL for user profile picture {profile_pic_object_name}: {e}")
        return ""


@users_bp.route("/deleteUser", methods=["POST"])
def delete_user():

    data = request.get_json()

    user_token: str = data['user_token']

    db_accessor.delete_user(user_token=user_token)

    return jsonify({})


@users_bp.route("/getUserDetails", methods=["POST"])
def get_user_details():

    data = request.get_json()

    user_token: str = data['user_token']

    user_details = db_accessor.get_user_details(user_token=user_token)
    profile_pic_object_name = user_details["profile_pic_object_name"]

    user_details["profile_pic_url"] = _generate_user_profile_pic_url(profile_pic_object_name)

    return jsonify(user_details)


@users_bp.route("/storeUserCredentials", methods=["POST"])
def create_user():

    data = request.get_json()
    username: str = data['username']
    fullname: str = data['fullname']
    password: str = data['password']

    try:
        user_token = db_accessor.create_user(
            username=username,
            fullname=fullname,
            password=password
        )
    except NameError as e:
        return jsonify({"error": str(e)}), 409

    return jsonify({'user_token': user_token})


@users_bp.route("/updateUserDetails", methods=["POST"])
def update_user_details():

    data = request.get_json()
    logger.debug(f"Received update user request data: {data}")
    user_token: str           = data['user_token']
    username: str             = data['username']
    fullname: str             = data['fullname']
    bio: str                  = data['bio']
    profile_pic_object_key: str = data['image_object_key']
    location: str             = data.get('location', '')
    is_public: bool           = data.get('is_public', False)

    try:
        db_accessor.update_user_details(
            user_token=user_token,
            username=username,
            fullname=fullname,
            bio=bio,
            profile_pic_object_name=profile_pic_object_key,
            location=location,
            is_public=is_public
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 409

    return jsonify({})


@users_bp.route("/getTagsForUser", methods=["POST"])
def get_tags_for_user():

    data = request.get_json()
    user_token: str = data['user_token']

    tags = db_accessor.get_tags_for_user(user_token=user_token)

    return jsonify(tags)


@users_bp.route("/searchUsers", methods=["GET"])
def search_users():
    q          = request.args.get("q", "").strip()
    user_token = request.args.get("user_token", "")

    if not db_accessor.validate_token(user_token):
        return jsonify({"message": "Invalid user token"}), 401

    if not q:
        return jsonify([])

    results = db_accessor.search_users_by_username(prefix=q)

    for r in results:
        r["profile_pic_url"] = _generate_user_profile_pic_url(r.pop("profile_pic_object_name"))

    return jsonify(results)


@users_bp.route("/getUserById", methods=["POST"])
def get_user_by_id():
    data = request.get_json()
    user_token     = data["user_token"]
    target_user_id = data["user_id"]

    if not db_accessor.validate_token(user_token):
        return jsonify({"message": "Invalid user token"}), 401

    user = db_accessor.get_user_by_id(target_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    user["profile_pic_url"] = _generate_user_profile_pic_url(user.pop("profile_pic_object_name"))

    return jsonify(user)
