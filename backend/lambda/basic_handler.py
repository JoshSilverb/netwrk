import json
import sys
sys.path.append("./packages")
import os
import boto3

# to bundle into zip file for upload to AWS, get into netwrk-backend/lambda/
# and run:
#  zip deployment_package.zip basic_handler.py

def lambda_handler(event, context):
    print("Lambda started")

    s3_bucket_name = "netwrkbucket"
    lambda_tmp_directory = "/tmp"
    input_file_name = "placeholderContacts.json"
    input_file_path = os.path.join(lambda_tmp_directory, input_file_name)

    try:
        print("Downloading file from s3")
        # Download placeholder contact data from S3.
        client = boto3.client('s3')
        print("Successfully connected to s3")
        client.download_file(s3_bucket_name, input_file_name, input_file_path)
        print("Successfully downloaded from s3")
    except Exception as e:
        print(e)
    
    # Convert output file into bytes.
    with open(input_file_path) as inputFile:
        contacts = json.load(inputFile)

    print("Got the following contacts:", json.dumps(contacts))


    # Send it back as a response.
    return {
        "statusCode": 200,
        "body": json.dumps(contacts)
    }
