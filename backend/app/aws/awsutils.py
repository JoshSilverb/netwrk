import boto3
import uuid
import io
import logging

from app.config import Config

logger = logging.getLogger(__name__)


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


def getSignedS3ObjectURL(object_key):
    s3_client = boto3.client('s3')
    url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": Config.S3_BUCKET_NAME, "Key": object_key},
        ExpiresIn=30
    )

    return url