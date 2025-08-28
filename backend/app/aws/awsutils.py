import boto3
import uuid
import io
import logging

from app.config import Config

logger = logging.getLogger(__name__)


def uploadFileToS3(file) -> str:
    s3_client = boto3.client('s3')
    try:
        object_name = uuid.uuid4().hex.strip()
        response = s3_client.upload_fileobj(io.BytesIO(file), Config.S3_BUCKET_NAME, object_name)
    except Exception as e:
        logger.error(f"Failed to upload file to S3: {e}")
        return ''
    return object_name


def getSignedS3ObjectURL(object_key):
    s3_client = boto3.client('s3')
    url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": Config.S3_BUCKET_NAME, "Key": object_key},
        ExpiresIn=30
    )

    return url