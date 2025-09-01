from flask import Blueprint, jsonify, request
import json
import logging

from app.db import accessor as db_accessor
from app.aws import awsutils

logger = logging.getLogger(__name__)


users_bp = Blueprint("users", __name__)

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
    
    profile_pic_url = ""

    if profile_pic_object_name:
        profile_pic_url = awsutils.getSignedS3ObjectURL(profile_pic_object_name)

        if not profile_pic_url:
            logger.error(f"failed to get signed url for profile picture with object ID: {profile_pic_object_name}")

    user_details["profile_pic_url"] = profile_pic_url

    return jsonify(user_details)


@users_bp.route("/storeUserCredentials", methods=["POST"])
def create_user():

    data = request.get_json()
    username: str = data['username']
    password: str = data['password']

    user_token = db_accessor.create_user(username=username, password=password)

    return jsonify({'user_token': user_token})


@users_bp.route("/updateUserPicture/<user_token>", methods=["POST"])
def update_user_picture(user_token):
    logger.info("Got update user picture request")

    logger.debug(f"Profile picture in request files: {'profile_pic' in request.files}")

    if 'profile_pic' not in request.files:
        # If no profile picture is given, do nothing.

        return jsonify({})

    profile_pic_file = request.files['profile_pic']
    s3_object_name = awsutils.uploadFileToS3(profile_pic_file)

    if not s3_object_name:
        return jsonify({"message": "failed to upload profile picture"}), 500
    
    logger.debug("Calling database update user function")
    db_accessor.update_user_picture(user_token, s3_object_name)

    return jsonify({})


@users_bp.route("/updateUserDetails", methods=["POST"])
def update_user_details():

    data = request.get_json()
    logger.debug(f"Received update user request data: {data}")
    user_token: int = data['user_token']
    bio: str = data['bio']

    logger.debug("Calling database update user function")
    db_accessor.update_user_details(user_token, bio)

    return jsonify({})


@users_bp.route("/getTagsForUser", methods=["POST"])
def get_tags_for_user():

    data = request.get_json()
    user_token: str = data['user_token']

    tags = db_accessor.get_tags_for_user(user_token=user_token)

    return jsonify(tags)

