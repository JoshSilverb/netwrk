import boto3
import uuid
import io
import logging

from enum import Enum

from app.config import Config

logger = logging.getLogger(__name__)


class S3ObjectMethods(Enum):
    UPLOAD = "put_object"
    DOWNLOAD = "get_object"


def uploadFileToS3(file) -> str:
    s3_client = boto3.client('s3')
    try:
        object_key = uuid.uuid4().hex.strip()
        object_bytes = file.read()
        response = s3_client.put_object(Body=object_bytes, Bucket=Config.S3_BUCKET_NAME, Key=object_key)
    except Exception as e:
        logger.error(f"Failed to upload file to S3: {e}")
        return ''
    return object_key


def getSignedS3ObjectURL(object_key, method: S3ObjectMethods, filetype=None):
    params = {"Bucket": Config.S3_BUCKET_NAME, "Key": object_key}
    if filetype:
        logging.info(f"Adding content type: {filetype}")
        params["ContentType"] = filetype

    s3_client = boto3.client('s3')
    url = s3_client.generate_presigned_url(
        method.value,
        Params=params,
        ExpiresIn=60
    )

    return url