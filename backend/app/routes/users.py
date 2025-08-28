from flask import Blueprint, jsonify, request

from app.db import accessor as db_accessor
from app.aws import awsutils


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

    return jsonify(user_details)


@users_bp.route("/storeUserCredentials", methods=["POST"])
def create_user():

    data = request.get_json()
    username: str = data['username']
    password: str = data['password']

    user_token = db_accessor.create_user(username=username, password=password)

    return jsonify({'user_token': user_token})


@users_bp.route("/updateUser", methods=["POST"])
def update_user():

    data = request.get_json()
    user_token: int = data['user_token']
    bio: str = data['bio']
    profile_pic_file = request.files.get('profile_pic', '')

    profile_pic_url = awsutils.uploadFileToS3(profile_pic_file, f'/profiles/{user_id}', 'netwrkbucket')

    if not profile_pic_url:
        return jsonify({"message": "failed to upload profile picture"}), 500

    db_accessor.update_user(user_token, bio, profile_pic_url)

    return jsonify({})


@users_bp.route("/getTagsForUser", methods=["POST"])
def get_tags_for_user():

    data = request.get_json()
    user_token: str = data['user_token']

    tags = db_accessor.get_tags_for_user(user_token=user_token)

    return jsonify(tags)

