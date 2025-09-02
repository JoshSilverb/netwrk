from flask import Blueprint, jsonify, request
from app.models.user import User
from app.db import accessor as db_accessor
from app.aws import awsutils

import uuid
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/validateUserCredentials", methods=["POST"])
def get_users():

    data = request.get_json()

    username: str = data['username']
    password: str = data['password']

    user_token = db_accessor.validate_user_credentials_and_regenerate_token(username=username, password=password)
    
    return jsonify({"user_token": user_token})


@auth_bp.route("/generate_upload_url", methods=["POST"])
def generate_upload_url():
    data = request.get_json()
    user_token = data["user_token"]
    filetype = data["filetype"]   # e.g., "image/png"

    logging.info(f"Got generateUploadUrl request with token='{user_token}' filetype='{filetype}'")

    if not db_accessor.validate_token(user_token):
        return jsonify({"message": "Invalid user token"}), 401
    
    s3_object_key = uuid.uuid4().hex.strip()

    presigned_url = awsutils.getSignedS3ObjectURL(s3_object_key, awsutils.S3ObjectMethods.UPLOAD, filetype)

    logging.info(f"Generated signed upload url for s3 object key: {s3_object_key}")

    return jsonify({"upload_url": presigned_url, "filename": s3_object_key})