import boto3
import uuid

from app.config import Config


def uploadFileToS3(file) -> str:
    s3_client = boto3.client('s3')
    try:
        object_name = uuid.uuid4().hex.strip()
        response = s3_client.upload_fileobj(file, Config.S3_BUCKET_NAME, object_name)
    except Exception as e:
        print(f"Failed to upload file to s3 with error: {e}")
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