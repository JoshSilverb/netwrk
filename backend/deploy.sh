#!/bin/bash

# This must be run from the backend/ directory

# 1. Build and push the Lambda container image
aws ecr get-login-password --region us-east-2 \
  | docker login --username AWS --password-stdin \
    711387105820.dkr.ecr.us-east-2.amazonaws.com

docker build -f Dockerfile.lambda --platform linux/amd64 --provenance=false \
  -t 711387105820.dkr.ecr.us-east-2.amazonaws.com/netwrk-backend:latest .

docker push 711387105820.dkr.ecr.us-east-2.amazonaws.com/netwrk-backend:latest

# 2. Update the Lambda function
aws lambda update-function-code \
  --function-name netwrk-backend \
  --image-uri 711387105820.dkr.ecr.us-east-2.amazonaws.com/netwrk-backend:latest \
  --region us-east-2